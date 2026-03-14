---
name: hilt-di
description: |
  Hilt dependency injection for Android. Use this skill whenever working with
  Hilt in any Android project — @HiltViewModel, hiltViewModel(), @AndroidEntryPoint,
  @HiltAndroidApp, @Module, @InstallIn, @Provides, @Binds, @Singleton, @ViewModelScoped,
  @ActivityScoped, @Qualifier, @EntryPoint, EntryPointAccessors, @AssistedInject,
  @HiltWorker, HiltWorkerFactory, @HiltAndroidTest, @UninstallModules, @BindValue,
  SavedStateHandle, CoroutineExceptionHandler, or any Dagger/Hilt compile error.
---

# Hilt Dependency Injection

Production-complete Hilt DI patterns. 12 rules across 7 categories, ordered by impact.

## Setup

```kotlin
// build.gradle.kts (project root)
plugins {
    id("com.google.devtools.ksp") version "1.9.22-1.0.17" apply false
    id("com.google.dagger.hilt.android") version "2.51.1" apply false
}

// build.gradle.kts (app)
plugins {
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}
dependencies {
    implementation("com.google.dagger:hilt-android:2.51.1")
    ksp("com.google.dagger:hilt-android-compiler:2.51.1")       // ← KSP, not kapt
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    implementation("androidx.hilt:hilt-work:1.2.0")
    ksp("androidx.hilt:hilt-compiler:1.2.0")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.51.1")
    kspAndroidTest("com.google.dagger:hilt-android-compiler:2.51.1")
}
```

```kotlin
@HiltAndroidApp   // ← mandatory on Application class — triggers code generation
class MyApplication : Application()
// AndroidManifest.xml: android:name=".MyApplication"

@AndroidEntryPoint   // ← mandatory on every Activity/Fragment using injection
class MainActivity : ComponentActivity()
```

---

## CRITICAL — Scopes

### Rule 1: Match Scope to Lifetime

```kotlin
// @Singleton     → SingletonComponent    → app lifetime (repositories, network, DB)
// @ViewModelScoped → ViewModelComponent  → one ViewModel's lifetime (use cases)
// @ActivityScoped → ActivityComponent   → activity lifetime
// (unscoped)                            → new instance per injection (mappers, utils)

@Module @InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "app.db").build()
}

@Module @InstallIn(ViewModelComponent::class)
abstract class UseCaseModule {
    @Binds @ViewModelScoped
    abstract fun bindSolveUseCase(impl: SolveUseCaseImpl): SolveUseCase
}
// ❌ @Singleton for everything — prevents test isolation, wastes memory
// ❌ Unscoped Repository — new instance per injection, loses cached state
```

---

## CRITICAL — Modules

### Rule 2: @Provides for third-party, @Binds for your interfaces

```kotlin
// ✅ @Provides — classes you don't own (OkHttp, Retrofit, Supabase, Room)
@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) { install(Auth); install(Functions); install(Postgrest) }
}

// ✅ @Binds — your interface + implementation with @Inject constructor
// More efficient than @Provides — no wrapper function generated
@Module @InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository

    @Binds @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    companion object {
        // Mix @Provides in companion object when needed alongside @Binds
        @Provides @Singleton
        fun provideApiConfig(): ApiConfig = ApiConfig.default()
    }
}

// ScanRepositoryImpl must have @Inject constructor for @Binds to work
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository

// ❌ @Binds in object module — compile error (@Binds must be abstract)
// ❌ @Provides in abstract class without companion object — compile error
```

---

## CRITICAL — ViewModels

### Rule 3: @HiltViewModel + hiltViewModel()

```kotlin
// ✅ Standard ViewModel — @HiltViewModel + @Inject constructor
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val scanRepository: ScanRepository,
    private val savedStateHandle: SavedStateHandle   // ← Hilt provides automatically
) : ViewModel() {
    // Read nav args type-safely
    private val questionId: String = checkNotNull(savedStateHandle["questionId"])
}

// ✅ In Composable — always hiltViewModel()
@Composable
fun ScanScreen(viewModel: ScanViewModel = hiltViewModel()) { ... }

// ✅ Shared ViewModel scoped to nav graph
@Composable
fun CheckoutScreen(navController: NavController) {
    val entry = remember(navController) { navController.getBackStackEntry("checkout_graph") }
    val sharedVm: CheckoutViewModel = hiltViewModel(entry)
}

// ❌ ViewModelProvider() — bypasses Hilt injection
// ❌ Manual ViewModelProvider.Factory — unnecessary with Hilt
// ❌ Injecting Activity into ViewModel — memory leak
```

### Rule 4: Assisted Injection for Runtime Parameters

```kotlin
// ✅ When ViewModel needs both injected deps AND runtime args
@HiltViewModel(assistedFactory = DetailViewModel.Factory::class)
class DetailViewModel @AssistedInject constructor(
    @Assisted val itemId: String,              // ← runtime — from navigation
    private val repository: ItemRepository    // ← injected by Hilt
) : ViewModel() {
    @AssistedFactory
    interface Factory { fun create(itemId: String): DetailViewModel }
}

// ✅ In Composable
val viewModel = hiltViewModel<DetailViewModel, DetailViewModel.Factory> { factory ->
    factory.create(itemId = itemId)
}
// Prefer SavedStateHandle for simple nav args — simpler, survives process death
```

---

## HIGH — Qualifiers

### Rule 5: Qualifiers for Multiple Bindings of Same Type

```kotlin
// ✅ Define qualifiers with @Retention(BINARY)
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class IoDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class DefaultDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class AuthenticatedClient
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class AnonymousClient

// ✅ Provide with qualifiers
@Module @InstallIn(SingletonComponent::class)
object DispatcherModule {
    @Provides @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides @DefaultDispatcher
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default
}

// ✅ Inject with qualifier
class ScanRepositoryImpl @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
)
// ❌ No qualifier for same type — compile error "bound multiple times"
// ❌ @Retention(RUNTIME) — use BINARY
```

---

## HIGH — Entry Points

### Rule 6: @EntryPoint for Non-Hilt Classes

```kotlin
// ✅ ContentProvider, BroadcastReceiver, custom View — can't use @AndroidEntryPoint
@EntryPoint
@InstallIn(SingletonComponent::class)
interface AppEntryPoint {
    fun scanRepository(): ScanRepository
    fun analyticsTracker(): AnalyticsTracker
}

// Access from any context
val repo = EntryPointAccessors
    .fromApplication(context.applicationContext, AppEntryPoint::class.java)
    .scanRepository()

// Activity-scoped entry point
@EntryPoint @InstallIn(ActivityComponent::class)
interface ActivityEntryPoint { fun navManager(): NavigationManager }
val nav = EntryPointAccessors.fromActivity(activity, ActivityEntryPoint::class.java).navManager()

// ❌ @AndroidEntryPoint on ContentProvider/BroadcastReceiver — not supported
// ❌ fromApplication() with activity context for SingletonComponent — must be applicationContext
```

---

## MEDIUM — WorkManager

### Rule 7: @HiltWorker + HiltWorkerFactory

```kotlin
// ✅ Worker
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncRepository: SyncRepository
) : CoroutineWorker(context, workerParams) {
    override suspend fun doWork(): Result = try {
        syncRepository.syncAll(); Result.success()
    } catch (e: Exception) {
        if (runAttemptCount < 3) Result.retry() else Result.failure()
    }
}

// ✅ Application — register HiltWorkerFactory
@HiltAndroidApp
class MyApplication : Application(), Configuration.Provider {
    @Inject lateinit var workerFactory: HiltWorkerFactory
    override val workManagerConfiguration
        get() = Configuration.Builder().setWorkerFactory(workerFactory).build()
}
// Also remove default WorkManager initializer in AndroidManifest.xml (tools:node="remove")
// ❌ @AndroidEntryPoint on Worker — not supported
// ❌ Missing HiltWorkerFactory in Application — workers get no injection
```

---

## CRITICAL — Testing

### Rule 8: @HiltAndroidTest + @BindValue for Test Doubles

```kotlin
// ✅ Replace real module with fake
@UninstallModules(RepositoryModule::class)
@HiltAndroidTest
class ScanViewModelTest {

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)   // ← order 0 always
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<MainActivity>()

    @BindValue @JvmField
    val fakeScanRepo: ScanRepository = FakeScanRepository()   // ← replaces real binding

    @BindValue @IoDispatcher @JvmField
    val testDispatcher: CoroutineDispatcher = UnconfinedTestDispatcher()

    @Before fun setUp() { hiltRule.inject() }   // ← must call before @Inject fields

    @Test
    fun `shows loading while solving`() {
        composeRule.onNodeWithTag("scan_button").performClick()
        composeRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
    }
}

// ✅ Unit tests — no Hilt, inject directly
class ScanViewModelUnitTest {
    private val viewModel = ScanViewModel(scanRepository = FakeScanRepository())
    @Test fun `state is loading when solve starts`() = runTest { ... }
}
// ❌ Missing hiltRule.inject() → @Inject fields null → NullPointerException
// ❌ hiltRule order != 0 → injection before rule setup → crash
```

---

## Common Errors Quick Reference

| Error | Cause | Fix |
|---|---|---|
| `cannot be provided without @Inject or @Provides` | Missing binding | Add `@Inject` constructor or module binding |
| `@Binds methods must be abstract` | `@Binds` in `object` module | Change to `abstract class` |
| `lateinit not initialized` | Missing `hiltRule.inject()` or `@AndroidEntryPoint` | Add both |
| `HiltComponents.SingletonC not found` | Missing `@HiltAndroidApp` | Add to Application class |
| `may only be used in @XComponent` | Scope/component mismatch | Match scope to `@InstallIn` |
| `bound multiple times` | Two providers for same type | Add `@Qualifier` annotations |

---

## References

- `references/component-hierarchy.md` — Full component tree, scope-to-component mapping, standard module organization, @Provides vs @Binds decision guide. Read when setting up a new module or choosing a scope.
- `rules/` — 12 individual rule files with complete examples, anti-patterns, and error explanations for each rule above.
