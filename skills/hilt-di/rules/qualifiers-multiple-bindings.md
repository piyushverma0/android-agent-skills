# Qualifiers — Multiple Bindings of the Same Type

**Impact: HIGH**

When you need two instances of the same type (e.g., two OkHttpClients, two
Dispatchers), Hilt can't distinguish them without qualifiers.
Missing qualifiers cause the wrong instance to be injected silently.

## Rule

### 1. Define custom qualifier annotations

```kotlin
// ✅ Custom qualifier — @Retention(BINARY) is required for Hilt
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AuthenticatedClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AnonymousClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class IoDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class DefaultDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class MainDispatcher
```

### 2. Provide qualified bindings

```kotlin
// ✅ Network clients
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton @AuthenticatedClient
    fun provideAuthOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .build()

    @Provides @Singleton @AnonymousClient
    fun provideAnonOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .build()
}

// ✅ Dispatchers — inject for testability
@Module @InstallIn(SingletonComponent::class)
object DispatcherModule {

    @Provides @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides @DefaultDispatcher
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default

    @Provides @MainDispatcher
    fun provideMainDispatcher(): CoroutineDispatcher = Dispatchers.Main
}
```

### 3. Inject with qualifiers

```kotlin
// ✅ Use qualifier at injection site
class ScanApiService @Inject constructor(
    @AuthenticatedClient private val client: OkHttpClient   // ← with auth interceptor
)

class PublicApiService @Inject constructor(
    @AnonymousClient private val client: OkHttpClient       // ← no auth
)

// ✅ Repository injects typed dispatcher
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {
    override suspend fun getQuestions() = withContext(ioDispatcher) { ... }
}

// ✅ Replace with test dispatcher in tests
@UninstallModules(DispatcherModule::class)
@HiltAndroidTest
class ScanRepositoryTest {
    @BindValue @IoDispatcher @JvmField
    val testDispatcher: CoroutineDispatcher = UnconfinedTestDispatcher()
}
```

### 4. Built-in Hilt qualifiers

```kotlin
// Hilt provides these out of the box — no custom qualifier needed
class MyRepository @Inject constructor(
    @ApplicationContext private val context: Context,    // ← Application context
    // @ActivityContext — only available in ActivityComponent or narrower
)
```

## Anti-Patterns

```kotlin
// ❌ No qualifier — Hilt can't distinguish which OkHttpClient to inject
@Provides @Singleton
fun provideClient1(): OkHttpClient = ...   // ❌ same return type as provideClient2

@Provides @Singleton
fun provideClient2(): OkHttpClient = ...   // ❌ duplicate binding — compile error

// ❌ @Retention(RUNTIME) instead of BINARY — larger binary, not needed by Hilt
@Qualifier
@Retention(AnnotationRetention.RUNTIME)   // ❌ use BINARY
annotation class MyQualifier

// ❌ Hardcoded Dispatchers in repository — prevents test control
class Repo @Inject constructor() {
    suspend fun load() = withContext(Dispatchers.IO) { ... }  // ❌ hardcoded
}
// ✅ Inject @IoDispatcher CoroutineDispatcher
```
