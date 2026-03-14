# Supabase Edge Function Templates

## Full Auth + xAI Template

Complete edge function with the correct auth pattern, input validation, and xAI integration.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl            = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey        = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // 1. Extract JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify JWT — persistSession: false is REQUIRED in edge functions
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth:   { persistSession: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // 3. Parse & validate body
    const body = await req.json();
    if (!body.required_field) {
      return new Response(JSON.stringify({ error: "required_field is missing" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Business logic (use adminClient for elevated operations)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    // ... your logic here

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[function-name] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## config.toml

Every function that handles its own auth needs this:

```toml
[functions.function-name]
verify_jwt = false
```

## Android Invocation

```kotlin
suspend fun callFunction(payload: MyPayload): MyResponse =
    withContext(Dispatchers.IO) {
        supabase.functions.invoke(
            function = "function-name",
            body     = Json.encodeToJsonElement(payload).jsonObject
        ).body<MyResponse>()
    }
```
