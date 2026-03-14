# Supabase SDK Setup and Hilt Integration

**Impact: CRITICAL**

Incorrect SDK setup — wrong BOM version, missing plugins, or wrong Hilt scope —
causes runtime crashes or multiple client instances being created.

## Rule

### 1. Dependencies

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

// Serialization — required for decodeList<T> / body<T>
plugins { kotlin("plugin.serialization") version "1.9.22" }
implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
```

### 2. Hilt Module — always @Singleton

```kotlin
// di/SupabaseModule.kt
@Module
@InstallIn(SingletonComponent::class)   // ← Singleton — one client per app lifetime
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,       // ← from local.properties
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY   // ← anon key, never service role
    ) {
        install(Auth)
        install(Functions)
        install(Postgrest)
        install(Realtime)
        install(Storage)
    }
}
```

### 3. local.properties — store keys here, never in code

```properties
# local.properties (git-ignored)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

```kotlin
// build.gradle.kts — expose to BuildConfig
android {
    defaultConfig {
        buildConfigField("String", "SUPABASE_URL",
            "\"${properties["SUPABASE_URL"]}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY",
            "\"${properties["SUPABASE_ANON_KEY"]}\"")
    }
    buildFeatures { buildConfig = true }
}
```

### 4. Data classes — must be @Serializable

```kotlin
// ✅ All data classes used with Supabase must be @Serializable
@Serializable
data class Question(
    val id: String,
    val text: String,
    val subject: String,
    @SerialName("user_id") val userId: String,        // ← map snake_case DB columns
    @SerialName("created_at") val createdAt: String,
    val difficulty: String? = null                    // ← nullable for optional columns
)
```

## Anti-Patterns

```kotlin
// ❌ Service role key in Android app — exposes admin access
supabaseKey = BuildConfig.SUPABASE_SERVICE_ROLE_KEY  // ❌ NEVER in client app

// ❌ Multiple SupabaseClient instances — creates duplicate connections
class RepositoryA @Inject constructor() {
    val supabase = createSupabaseClient(...)  // ❌ creates new instance per injection
}

// ❌ Hardcoded keys in source code
val supabaseUrl = "https://abc.supabase.co"  // ❌ committed to git

// ❌ Missing @Serializable — decodeList() throws at runtime
data class Question(val id: String)  // ❌ will crash on decode
```
