# Edge Function JWT Auth — persistSession:false + getUser(jwt)

**Impact: CRITICAL**

The most common Android + Supabase bug. `UnauthorizedRestException` from edge
functions is caused by one missing option in `createClient` on the Deno side.
Every edge function that verifies auth must use this exact pattern.

## The Problem

Edge functions are **stateless** — each invocation is a fresh Deno process.
Without `persistSession: false`, the Supabase client tries to read a cached
session that doesn't exist, so `getUser()` returns `null` even with a perfectly
valid JWT sent from the Android app.

## The Fix — Exact Pattern, Never Deviate

### Android side — functions.invoke() attaches JWT automatically

```kotlin
// ✅ supabase-kt attaches the user's JWT automatically — no manual header needed
val response = supabase.functions.invoke(
    function = "scan-solve-question",
    body = buildJsonObject {
        put("question_text", questionText)
        put("mode", mode)
        put("super_ai", superAi)
    }
)
val result = response.body<ScanSolveResponse>()
```

### Edge function side — the exact auth pattern

```typescript
// ✅ Step 1: Extract JWT from Authorization header
const authHeader = req.headers.get('Authorization') ?? ''
const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()

if (!jwt) {
  return new Response(
    JSON.stringify({ error: 'Missing Authorization header' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}

// ✅ Step 2: Verify JWT — TWO things are both required:
// - persistSession: false  ← CRITICAL, edge functions are stateless
// - getUser(jwt)           ← pass jwt directly, NOT getUser() with no args
const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: `Bearer ${jwt}` } },
  auth:   { persistSession: false },   // ← without this, getUser() always returns null
})
const { data: userData, error: userError } = await userClient.auth.getUser(jwt)

if (userError || !userData?.user?.id) {
  console.error('[function-name] auth failed:', userError?.message)
  return new Response(
    JSON.stringify({ error: 'Unauthorized: invalid or expired session' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
const authenticatedUserId = userData.user.id
```

### config.toml — required alongside the pattern above

```toml
# supabase/functions/your-function/config.toml
[functions.your-function]
verify_jwt = false   # Auth handled manually inside — Supabase's built-in check is disabled
```

## Anti-Patterns

```typescript
// ❌ Missing persistSession: false — getUser() returns null on every call
const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } },
  // ← missing auth: { persistSession: false }
})
const { data } = await userClient.auth.getUser()  // ← returns null, user_id: null in logs

// ❌ getUser() with no args — reads from session cache (empty in edge functions)
await userClient.auth.getUser()      // ❌ always null in edge functions
await userClient.auth.getUser(jwt)   // ✅ validates directly against Supabase Auth

// ❌ Using service role key for user verification — wrong client for auth check
const serviceClient = createClient(supabaseUrl, serviceRoleKey)
await serviceClient.auth.getUser(jwt)  // ❌ use anonKey client for user verification
```

## Debugging — What Logs Tell You

```
user_id: null in logs     → missing persistSession:false OR getUser() called without jwt
UnauthorizedRestException → function returning 401 — check both issues above
FunctionsHttpException 401 → verify_jwt = true in config.toml blocking the request
```
