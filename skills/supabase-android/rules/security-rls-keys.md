# Security — RLS Policies, Keys, and Data Exposure

**Impact: CRITICAL**

Using the service role key in an Android app exposes admin database access to anyone
who decompiles the APK. Missing RLS policies expose all users' data to each other.

## Rule

### 1. Key hierarchy — never use service role key in Android

```kotlin
// ✅ Android app uses ANON key only
createSupabaseClient(
    supabaseUrl = BuildConfig.SUPABASE_URL,
    supabaseKey = BuildConfig.SUPABASE_ANON_KEY   // ← anon key, enforced by RLS
)

// ❌ NEVER in Android app
supabaseKey = BuildConfig.SUPABASE_SERVICE_ROLE_KEY   // ← bypasses ALL RLS policies
```

### 2. Service role key — only in edge functions (server-side)

```typescript
// ✅ Service role key only in Deno edge functions — server-side, never client-side
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Use for: consuming quota RPC, admin DB writes, bypassing RLS intentionally
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
await adminClient.rpc('consume_scan_quota', { p_user_id: userId })
```

### 3. RLS policies — every table needs them

```sql
-- ✅ Enable RLS on every user-data table
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- ✅ Users can only see their own rows
CREATE POLICY "Users see own scan history"
ON scan_history FOR SELECT
USING (auth.uid() = user_id);

-- ✅ Users can only insert their own rows
CREATE POLICY "Users insert own scan history"
ON scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ✅ Users can only update their own rows
CREATE POLICY "Users update own rows"
ON scan_history FOR UPDATE
USING (auth.uid() = user_id);
```

### 4. Never log sensitive data

```kotlin
// ❌ Logging JWT tokens or user data
Log.d("DEBUG", "JWT: ${session.accessToken}")   // ❌ JWT visible in logcat
Log.d("DEBUG", "User: ${user.email}")           // ❌ PII in logcat

// ✅ Log only non-sensitive identifiers
Log.d("DEBUG", "User authenticated: ${user.id.take(8)}...")  // ← truncated ID only
```

### 5. BuildConfig security

```kotlin
// ✅ Keys in local.properties — git-ignored
// local.properties:
// SUPABASE_URL=https://...
// SUPABASE_ANON_KEY=eyJ...

// ✅ .gitignore must include local.properties
// .gitignore:
// local.properties

// ❌ Keys hardcoded in source
val url = "https://rmgtjzeuhckqhuwwzrlm.supabase.co"   // ❌ committed to git
val key = "eyJhbGciOiJIUzI1NiIsInR5cCI..."             // ❌ exposed in repo
```

### 6. Storage bucket policies

```sql
-- ✅ Private bucket — users access only their own files
CREATE POLICY "Users access own storage"
ON storage.objects FOR ALL
USING (
    bucket_id = 'question-images'
    AND auth.uid()::text = (storage.foldername(name))[2]
    -- path structure: users/{userId}/filename
);
```

## Security Checklist

```
□ Android app uses ANON key only — never service role
□ Service role key only in edge function env vars
□ RLS enabled on all user-data tables
□ SELECT/INSERT/UPDATE/DELETE policies on every table
□ local.properties in .gitignore
□ No JWT or PII in logs
□ Storage paths scoped to userId
□ Storage bucket policies restrict cross-user access
```
