# Edge Function Structure — Validation Order and Error Responses

**Impact: CRITICAL**

Edge functions that consume quota or perform irreversible actions must validate
input BEFORE consuming resources. Wrong validation order burns quota on bad requests.

## Rule

### Correct execution order — always follow this sequence

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // ── CORS preflight ─────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl            = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey        = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    // ── Step 1: Auth verification ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser(jwt)
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = userData.user.id

    // ── Step 2: Input validation BEFORE quota ──────────────────────────
    // ✅ Validate first — bad input should NOT burn quota
    const body = await req.json()
    if (!body.question_text && !body.image_base64) {
      return new Response(
        JSON.stringify({ error: 'Provide question_text or image_base64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Step 3: Quota check (after validation) ─────────────────────────
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: quotaData, error: quotaError } = await adminClient.rpc('consume_scan_quota', {
      p_user_id: userId,
      p_period_type: 'daily',
      p_free_limit: 5,
    })
    if (quotaError) throw new Error(`Quota RPC failed: ${quotaError.message}`)

    const quota = Array.isArray(quotaData) ? quotaData[0] : quotaData
    if (quota?.success !== true) {
      return new Response(
        JSON.stringify({
          error: quota?.error_message ?? 'Quota exhausted',
          error_code: 'SCAN_QUOTA_EXHAUSTED',
          remaining_scans: quota?.remaining_scans ?? 0,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── Step 4: Business logic (AI call, DB write, etc.) ───────────────
    // ... your logic here

    // ── Step 5: Success response ───────────────────────────────────────
    return new Response(JSON.stringify({ result: 'ok' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[function-name] error:', message)
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

## Anti-Patterns

```typescript
// ❌ Quota consumed before input validation — burns quota on bad requests
serve(async (req) => {
  await consumeQuota(userId)     // ❌ quota gone even if body is invalid
  const body = await req.json()
  if (!body.question_text) return error(400)  // ❌ too late
})

// ❌ No CORS headers — fails from web clients
return new Response(JSON.stringify(result))  // ❌ missing corsHeaders

// ❌ Service role key used for user auth check
const admin = createClient(url, serviceRoleKey)
await admin.auth.getUser(jwt)  // ❌ wrong client — use anon key for user verification

// ❌ No try/catch — unhandled errors return no response (Deno crash)
serve(async (req) => {
  const result = await riskyOperation()  // ❌ if this throws, no error response sent
  return new Response(JSON.stringify(result))
})
```
