---
name: supabase-android
description: |
  Supabase Kotlin SDK (supabase-kt) for Android. Use this skill whenever working
  with Supabase in Android/Kotlin — authentication, edge functions, database queries,
  realtime subscriptions, storage, RPC calls, JWT auth, UnauthorizedRestException,
  FunctionsHttpException, persistSession, getUser(jwt), sessionStatus Flow,
  FunctionsHttpException, config.toml verify_jwt, @Serializable, SerialName,
  decodeList, body<T>, or any supabase-kt API.
---

# Supabase Android

Production-complete Supabase Kotlin SDK patterns. 12 rules across 6 categories.

## Setup

```kotlin
// build.gradle.kts (app)
val supabaseVersion = "3.0.1"
implementation(platform("io.github.jan-tennert.supabase:bom:$supabaseVersion"))
implementation("io.github.jan-tennert.supabase:postgrest-kt")
implementation("io.github.jan-tennert.supabase:auth-kt")
implementation("io.github.jan-tennert.supabase:functions-kt")
implementation("io.github.jan-tennert.supabase:realtime-kt")
implementation("io.github.jan-tennert.supabase:storage-kt")
implementation("io.ktor:ktor-client-android:2.3.7")
implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
plugins { kotlin("plugin.serialization") version "1.9.22" }
```

```kotlin
// di/SupabaseModule.kt — @Singleton, one instance per app
@Module @InstallIn(SingletonComponent::class)
object SupabaseModule {
    @Provides @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY   // ← ANON key only, never service role
    ) {
        install(Auth); install(Functions); install(Postgrest)
        install(Realtime); install(Storage)
    }
}
```

---

## CRITICAL — JWT Auth Pattern for Edge Functions

### Rule 1: persistSession:false + getUser(jwt) — exact pattern, never deviate

The most common Android + Supabase bug. `UnauthorizedRestException` is caused
by missing `persistSession: false` in the edge function's Supabase client.

```typescript
// ✅ Edge function — EXACT pattern required
const authHeader = req.headers.get('Authorization') ?? ''
const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()

if (!jwt) {
  return new Response(JSON.stringify({ error: 'Missing Authorization header' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// TWO things required — both are mandatory:
const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: `Bearer ${jwt}` } },
  auth:   { persistSession: false },   // ← CRITICAL: without this, getUser() returns null
})
const { data: userData, error } = await userClient.auth.getUser(jwt)  // ← pass jwt directly
if (error || !userData?.user?.id) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... })
}
const userId = userData.user.id
```

```toml
# supabase/functions/your-function/config.toml
[functions.your-function]
verify_jwt = false   # Auth handled manually inside
```

**Why `persistSession: false` is non-negotiable:** Edge functions are stateless —
fresh Deno process per invocation. Without it, the client reads a cached session
that doesn't exist → `getUser()` returns `null` → `user_id: null` in logs.

**Why `getUser(jwt)` not `getUser()`:** No-args version reads from empty session cache.
Passing `jwt` validates directly against Supabase Auth.

### Rule 2: Edge function execution order

```typescript
// ✅ Always in this order — never consume quota before validating input
// 1. CORS preflight check
// 2. Auth verification (JWT)
// 3. Input validation    ← BEFORE quota — bad input must NOT burn quota
// 4. Quota consumption
// 5. Business logic
// 6. Success response
// (wrap everything in try/catch — missing it means no error response on crash)
```

---

## CRITICAL — Android Side Invocation

### Rule 3: functions.invoke() — JWT attached automatically

```kotlin
// ✅ supabase-kt attaches JWT automatically — no manual header needed
suspend fun scanSolveQuestion(imageBase64: String, mode: String): ScanSolveResponse =
    withContext(Dispatchers.IO) {
        supabase.functions.invoke(
            function = "scan-solve-question",
            body = buildJsonObject {
                put("image_base64", imageBase64)
                put("mode", mode)
                put("super_ai", false)
            }
        ).body<ScanSolveResponse>()
    }

// ✅ Response data class — must be @Serializable, use @SerialName for snake_case
@Serializable
data class ScanSolveResponse(
    @SerialName("final_answer")          val finalAnswer: String,
    @SerialName("step_by_step")          val stepByStep: List<String>,
    val concept: String,
    val topic: String,
    val subject: String,
    @SerialName("extracted_question")    val extractedQuestion: String? = null,
    @SerialName("remaining_scans")       val remainingScans: Int = 0
)
```

---

## CRITICAL — Error Handling

### Rule 4: Handle each exception type differently

```kotlin
// ✅ Each exception has a specific cause and fix
try {
    supabase.functions.invoke("my-function", body = payload).body<MyResponse>()
} catch (e: FunctionsHttpException) {
    // ← HTTP error from your function (4xx, 5xx)
    when (e.response.status.value) {
        401  -> throw AuthException("Session expired")
        429  -> throw QuotaException("Quota exhausted")
        400  -> throw ValidationException("Invalid input")
        else -> throw ServerException("Server error")
    }
} catch (e: UnauthorizedRestException) {
    // ← JWT rejected by SDK before reaching function
    throw AuthException("Session expired — please log in again")
} catch (e: IOException) {
    throw NetworkException("No internet connection")
}
```

**Error quick-reference:**

| Exception | Cause | Fix |
|---|---|---|
| `UnauthorizedRestException` | JWT invalid OR `persistSession` missing | Add `persistSession: false` + `getUser(jwt)` |
| `FunctionsHttpException 401` | `verify_jwt = true` in config.toml | Add `verify_jwt = false` to config.toml |
| `FunctionsHttpException 429` | Quota exhausted | Show upgrade UI |
| `NoTransformationFoundException` | JSON doesn't match data class | Check `@SerialName` mappings |
| `user_id: null` in logs | `getUser()` called without jwt arg | Change to `getUser(jwt)` |

---

## CRITICAL — Security

### Rule 5: Anon key in Android, service role only in edge functions

```kotlin
// ❌ NEVER in Android app — exposes admin access to anyone who decompiles the APK
supabaseKey = BuildConfig.SUPABASE_SERVICE_ROLE_KEY

// ✅ Android always uses anon key
supabaseKey = BuildConfig.SUPABASE_ANON_KEY
```

```sql
-- ✅ RLS on every user-data table
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON scan_history FOR ALL USING (auth.uid() = user_id);
```

```
□ Anon key in Android, service role only in edge function env vars
□ RLS enabled on all user-data tables
□ local.properties in .gitignore — keys never committed
□ No JWT or PII in logs
□ Storage paths scoped to userId: "users/{userId}/filename"
```

---

## HIGH — Authentication

### Rule 6: Observe sessionStatus Flow — never poll

```kotlin
// ✅ Single StateFlow for auth state — reacts automatically to login/logout
val isAuthenticated: StateFlow<Boolean> = supabase.auth.sessionStatus
    .map { it is SessionStatus.Authenticated }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), false)

// ✅ Handle ALL session states — missing LoadingFromStorage causes blank screen flash
when (sessionStatus) {
    is SessionStatus.Authenticated    -> MainApp()
    is SessionStatus.NotAuthenticated -> LoginScreen()
    is SessionStatus.LoadingFromStorage -> SplashScreen()   // ← cold start
    is SessionStatus.RefreshFailure     -> { LoginScreen(); showSessionExpired() }
}

// ✅ Sign in
supabase.auth.signInWith(Email) { email = it; password = pass }
supabase.auth.signInWith(Google)
supabase.auth.signOut()
```

See `references/auth-flows.md` for OAuth setup, deep links, and common auth errors.

---

## HIGH — Database

### Rule 7: @Serializable + @SerialName + withContext(IO)

```kotlin
// ✅ Every data class used with Supabase must be @Serializable
@Serializable
data class Question(
    val id: String,
    @SerialName("user_id")    val userId: String,     // ← snake_case DB column
    @SerialName("created_at") val createdAt: String,
    val subject: String? = null                        // ← nullable for optional
)

// ✅ Queries — always in Repository, always withContext(IO)
val questions = supabase.from("questions")
    .select { filter { eq("user_id", userId); order("created_at", Order.DESCENDING) } }
    .decodeList<Question>()

supabase.from("scan_history").insert(ScanHistoryInsert(userId, question, answer))
supabase.from("user_prefs").upsert(prefs, onConflict = "user_id")

val quota = supabase.postgrest.rpc("check_scan_quota",
    buildJsonObject { put("p_user_id", userId); put("p_free_limit", 5) }
).decodeAs<QuotaResult>()
```

---

## HIGH — Realtime

### Rule 8: Connect, subscribe, clean up in onCleared()

```kotlin
// ✅ Realtime in ViewModel — always clean up
private var channel: RealtimeChannel? = null

init {
    viewModelScope.launch {
        supabase.realtime.connect()
        channel = supabase.channel("scan-results-$userId")
        channel!!.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
            table = "scan_results"; filter = "user_id=eq.$userId"   // ← filter required
        }.onEach { _uiState.update { s -> s.copy(latest = it.record.decodeRecord()) } }
         .launchIn(viewModelScope)
        channel!!.subscribe()
    }
}

override fun onCleared() {
    viewModelScope.launch { channel?.unsubscribe(); supabase.realtime.disconnect() }
}
```

---

## HIGH — Storage

### Rule 9: User-scoped paths, read bytes before upload

```kotlin
// ✅ Always scope path to userId
val path = "users/$userId/${UUID.randomUUID()}.jpg"   // ← prevents cross-user access

val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return
supabase.storage.from("question-images").upload(path = path, data = bytes)

val publicUrl = supabase.storage.from("question-images").publicUrl(path)
// ✅ Store path in DB, generate URL on demand — never store full URL
```

---

## HIGH — Repository Pattern

### Rule 10: All Supabase calls in Repository, never in ViewModel

```kotlin
// ✅ Interface — no SDK imports in domain layer
interface ScanRepository {
    suspend fun scanSolveQuestion(...): ScanSolveResponse
    fun observeScanHistory(userId: String): Flow<List<ScanHistory>>
}

// ✅ Impl — wraps SDK, runs on IO dispatcher
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {
    override suspend fun scanSolveQuestion(...) = withContext(ioDispatcher) {
        supabase.functions.invoke("scan-solve-question", body = buildJsonObject { ... })
            .body<ScanSolveResponse>()
    }
}

// ✅ Hilt binding
@Binds @Singleton abstract fun bind(impl: ScanRepositoryImpl): ScanRepository

// ✅ ViewModel uses interface only
class ScanViewModel @Inject constructor(private val repository: ScanRepository) : ViewModel()
```

---

## References

- `references/auth-flows.md` — Email, Google OAuth, session management, deep link setup, common auth errors. Read when implementing any authentication flow.
- `references/edge-functions.md` — Complete edge function template with auth, CORS, quota, xAI integration. Read when building a new edge function.
- `rules/` — 12 individual rule files with full examples and anti-patterns for each rule above.
