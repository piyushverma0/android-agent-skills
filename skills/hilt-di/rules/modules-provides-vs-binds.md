# Modules — @Provides vs @Binds

**Impact: CRITICAL**

`@Provides` in an abstract class and `@Binds` in a concrete class both cause
compile errors. Choosing the wrong one produces less efficient generated code.

## Rule

### @Provides — for classes you don't own (third-party, builders, factories)

```kotlin
// ✅ @Provides — creates the instance yourself
// Use when: the class has no @Inject constructor, requires configuration,
// or comes from a library you can't modify
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(
        @ApplicationContext context: Context,
        authInterceptor: AuthInterceptor
    ): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)
}
```

### @Binds — for your own interfaces with @Inject constructor implementations

```kotlin
// ✅ @Binds — tells Hilt which implementation to use for an interface
// More efficient than @Provides — no wrapper function generated
// MUST be in abstract class, MUST be abstract fun
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindScanRepository(
        impl: ScanRepositoryImpl   // ← Hilt injects this, passes to callers as ScanRepository
    ): ScanRepository

    @Binds
    @Singleton
    abstract fun bindUserRepository(
        impl: UserRepositoryImpl
    ): UserRepository

    @Binds
    @Singleton
    abstract fun bindQuestionRepository(
        impl: QuestionRepositoryImpl
    ): QuestionRepository
}

// Implementation has @Inject constructor — Hilt knows how to create it
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository { ... }
```

### Mixing @Provides and @Binds in one module

```kotlin
// ✅ Use companion object for @Provides inside abstract class
@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {

    // @Binds here
    @Binds @Singleton
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository

    companion object {
        // @Provides here — companion object is effectively static
        @Provides @Singleton
        fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(...)

        @Provides
        fun provideCoroutineDispatcher(): CoroutineDispatcher = Dispatchers.IO
    }
}
```

### @Provides with @ApplicationContext / @ActivityContext

```kotlin
// ✅ Hilt provides Context via qualifiers — no need to pass manually
@Provides @Singleton
fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
    Room.databaseBuilder(context, AppDatabase::class.java, "app.db").build()

// @ApplicationContext — Application context, use for long-lived dependencies
// @ActivityContext  — Activity context, only in ActivityComponent or narrower
```

## Decision Table

| Situation | Use |
|---|---|
| Third-party class (Retrofit, OkHttp, Room) | `@Provides` in `object` |
| Your interface + implementation with `@Inject` | `@Binds` in `abstract class` |
| Both in one module | `@Binds` in `abstract class` + `@Provides` in `companion object` |
| Needs Context | `@Provides` with `@ApplicationContext` param |

## Anti-Patterns

```kotlin
// ❌ @Binds in object (concrete) class — compile error
@Module @InstallIn(SingletonComponent::class)
object WrongModule {
    @Binds abstract fun bind(impl: Impl): Interface   // ❌ @Binds must be in abstract class
}

// ❌ @Provides in abstract class without companion — can't instantiate
@Module @InstallIn(SingletonComponent::class)
abstract class WrongModule {
    @Provides fun provideClient(): OkHttpClient = ...   // ❌ non-abstract in abstract class
}
// ✅ Put @Provides in companion object

// ❌ @Binds implementation missing @Inject constructor
class WrongImpl : MyInterface   // ❌ no @Inject constructor — Hilt can't create it
// ✅
class CorrectImpl @Inject constructor(private val dep: Dependency) : MyInterface
```
