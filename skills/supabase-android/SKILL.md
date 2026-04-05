---
name: supabase-android
description: |
  Supabase Kotlin SDK for Android AI agents. Use this skill whenever integrating Supabase
  in Android apps: supabase-kt setup, Auth (email/password, Google, phone OTP),
  UnauthorizedRestException fix, persistSession configuration, getUser(jwt) pattern,
  FunctionsHttpException, Edge Functions invocation, Realtime subscriptions, Postgres queries,
  Row Level Security, Supabase Storage file upload, sessionStatus Flow, verify_jwt in config.toml,
  @Serializable DTOs, decodeList, or any supabase-kt usage in Kotlin/Android.
---

# Supabase Android (supabase-kt)

## Setup

```toml
[versions]
supabase = "3.0.2"
ktor = "3.0.1"
[libraries]
supabase-bom = { group = "io.github.jan-tennert.supabase", name = "bom", version.ref = "supabase" }
supabase-postgrest = { group = "io.github.jan-tennert.supabase", name = "postgrest-kt" }
supabase-auth = { group = "io.github.jan-tennert.supabase", name = "auth-kt" }
supabase-realtime = { group = "io.github.jan-tennert.supabase", name = "realtime-kt" }
supabase-storage = { group = "io.github.jan-tennert.supabase", name = "storage-kt" }
supabase-functions = { group = "io.github.jan-tennert.supabase", name = "functions-kt" }
ktor-android = { group = "io.ktor", name = "ktor-client-android", version.ref = "ktor" }
```

```kotlin
implementation(platform(libs.supabase.bom))
implementation(libs.supabase.postgrest)
implementation(libs.supabase.auth)
implementation(libs.supabase.realtime)
implementation(libs.supabase.functions)
implementation(libs.ktor.android)
```

## Rule 1: Client initialization — the #1 mistake

```kotlin
// ✅ Correct Supabase client setup
@Module @InstallIn(SingletonComponent::class)
object SupabaseModule {
    @Provides @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(Auth) {
            scheme = "myapp"
            host = "callback"
        }
        install(Postgrest)
        install(Realtime)
        install(Storage)
        install(Functions)
    }
}
```

## Rule 2: Auth — the UnauthorizedRestException fix

```kotlin
// THE most common Supabase Android bug — fixed here permanently

// ❌ Wrong — causes UnauthorizedRestException on Edge Functions
val client = createSupabaseClient(url, anonKey) {
    install(Auth)  // persistSession defaults to true — getUser() returns null
}
val user = client.auth.currentUserOrNull()  // null after hot restart

// ✅ Correct — when calling Edge Functions with user JWT
suspend fun callSecureEdgeFunction(jwt: String): MyResponse {
    val userClient = createSupabaseClient(supabaseUrl, supabaseAnonKey) {
        install(Auth) {
            persistSession = false       // ← REQUIRED for JWT passthrough
        }
        install(Functions)
    }
    userClient.auth.getUser(jwt)         // ← pass jwt directly, always
    return userClient.functions.invoke("my-function")
}

// ✅ Standard auth — sign in and observe session
class AuthRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient
) : AuthRepository {
    override val sessionStatus: Flow<SessionStatus>
        get() = supabase.auth.sessionStatus

    override suspend fun signIn(email: String, password: String): Result<Unit> = runCatching {
        supabase.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    override suspend fun signUp(email: String, password: String): Result<Unit> = runCatching {
        supabase.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
    }

    override suspend fun signOut() { supabase.auth.signOut() }

    override fun currentUser(): UserInfo? = supabase.auth.currentUserOrNull()
}
```

## Rule 3: Postgrest — database queries

```kotlin
// ✅ DTOs must be @Serializable
@Serializable
data class ItemDto(
    val id: String,
    val title: String,
    val description: String,
    @SerialName("user_id") val userId: String,
    @SerialName("is_favorite") val isFavorite: Boolean = false,
    @SerialName("created_at") val createdAt: String
)

// ✅ CRUD operations
class ItemRemoteDataSource @Inject constructor(
    private val supabase: SupabaseClient
) {
    // SELECT
    suspend fun getItems(userId: String): List<ItemDto> =
        supabase.from("items")
            .select {
                filter { eq("user_id", userId) }
                order("created_at", Order.DESCENDING)
                limit(50)
            }
            .decodeList()   // ← always decodeList() for arrays

    // SELECT single
    suspend fun getItem(id: String): ItemDto =
        supabase.from("items")
            .select { filter { eq("id", id) } }
            .decodeSingle()

    // INSERT
    suspend fun createItem(item: ItemDto): ItemDto =
        supabase.from("items")
            .insert(item) { select() }
            .decodeSingle()

    // UPDATE
    suspend fun updateItem(id: String, updates: Map<String, Any>): ItemDto =
        supabase.from("items")
            .update(updates) {
                filter { eq("id", id) }
                select()
            }
            .decodeSingle()

    // UPSERT
    suspend fun upsertItem(item: ItemDto) {
        supabase.from("items").upsert(item)
    }

    // DELETE
    suspend fun deleteItem(id: String) {
        supabase.from("items").delete { filter { eq("id", id) } }
    }
}
```

## Rule 4: Edge Functions — correct invocation

```kotlin
// config.toml on server side
// [functions.my-function]
// verify_jwt = false    ← set when you handle JWT manually

// ✅ Invoke with typed request/response
@Serializable data class MyRequest(val itemId: String, val action: String)
@Serializable data class MyResponse(val success: Boolean, val message: String)

suspend fun invokeFunction(request: MyRequest): Result<MyResponse> = runCatching {
    supabase.functions.invoke(
        function = "my-function",
        body = request
    )
}
```

## Rule 5: Realtime subscriptions

```kotlin
// ✅ Subscribe to table changes
fun getItemsRealtime(userId: String): Flow<List<ItemDto>> = flow {
    val channel = supabase.realtime.createChannel("items-$userId")
    
    channel.postgresChangeFlow<PostgresAction>(schema = "public") {
        table = "items"
        filter = "user_id=eq.$userId"
    }.collect { action ->
        // Re-fetch full list on any change
        emit(getItems(userId))
    }
    
    supabase.realtime.connect()
    channel.subscribe()
    awaitCancellation()
}.onCompletion {
    supabase.realtime.removeAllChannels()
}
```

## Rule 6: Storage — file upload

```kotlin
// ✅ Upload file to Supabase Storage
suspend fun uploadImage(bucket: String, path: String, data: ByteArray): String {
    supabase.storage.from(bucket).upload(path, data) {
        upsert = true
        contentType = ContentType.Image.JPEG
    }
    return supabase.storage.from(bucket).publicUrl(path)
}
```

## Common Mistakes

❌ Missing `persistSession = false` when calling Edge Functions with user JWT
❌ Using `decodeSingle()` on a list query — use `decodeList()`
❌ Not making DTOs `@Serializable` — runtime crash on decode
❌ Calling Supabase on Main thread — all operations are suspend, call from coroutine
❌ `verify_jwt = true` on Edge Function that handles JWT manually — 401 error
❌ Not setting up Row Level Security — all users can see all data
