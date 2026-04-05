---
name: hilt-di
description: |
  Hilt dependency injection for Android AI agents. Use this skill whenever setting up Hilt,
  writing @HiltViewModel, @AndroidEntryPoint, @HiltAndroidApp, @Module, @InstallIn, @Provides,
  @Binds, @Singleton, @ViewModelScoped, @ActivityScoped, @EntryPoint, @AssistedInject,
  @HiltWorker, @HiltAndroidTest, @BindValue, or debugging any Dagger/Hilt compile error.
  Also applies when choosing between @Provides vs @Binds, scoping dependencies, injecting
  into non-Hilt classes, or setting up Hilt for testing. Always use this skill before
  writing any @Module, @HiltViewModel, or @AndroidEntryPoint.
---

# Hilt Dependency Injection

10 rules that fix what AI agents consistently get wrong with Hilt.

## Setup — required before any injection works

```kotlin
// MyApplication.kt — REQUIRED, must be declared in AndroidManifest
@HiltAndroidApp
class MyApplication : Application()

// AndroidManifest.xml
<application android:name=".MyApplication" ...>
```

```kotlin
// build.gradle.kts — use KSP, never kapt
plugins {
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}
dependencies {
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)                          // ← ksp, not kapt
    implementation(libs.androidx.hilt.navigation.compose)
}
```

## Rule 1: @Binds over @Provides for interface binding

```kotlin
// ✅ @Binds — zero runtime overhead, compiler-verified
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    @Singleton
    abstract fun bindItemRepository(impl: ItemRepositoryImpl): ItemRepository

    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository
}

// ❌ @Provides for interface — works but is less efficient
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideItemRepository(impl: ItemRepositoryImpl): ItemRepository = impl
}
```

## Rule 2: @Provides for third-party / constructed objects

```kotlin
// ✅ @Provides when you control construction
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply { level = Level.BODY })
            .connectTimeout(30, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
            .build()

    @Provides
    @Singleton
    fun provideItemApiService(retrofit: Retrofit): ItemApiService =
        retrofit.create(ItemApiService::class.java)
}
```

## Rule 3: Scope correctly

```kotlin
// @Singleton — one instance for app lifetime
@Binds @Singleton abstract fun bindRepo(impl: RepoImpl): Repo

// @ActivityRetainedScoped — survives rotation, dies with activity backstack
// (default for @HiltViewModel — don't re-declare it)

// @ViewModelScoped — tied to ViewModel lifetime
@Binds @ViewModelScoped abstract fun bindSomeHelper(impl: SomeHelperImpl): SomeHelper

// @ActivityScoped — tied to Activity lifetime (rare)
@Binds @ActivityScoped abstract fun bindNavigator(impl: NavigatorImpl): Navigator

// ❌ Injecting @Singleton into @ViewModelScoped — scope violation, Dagger error
```

## Rule 4: @HiltViewModel — correct pattern

```kotlin
// ✅ ViewModel injection
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getItems: GetItemsUseCase,
    private val savedStateHandle: SavedStateHandle  // free with Hilt
) : ViewModel() { ... }

// ✅ In Composable — always hiltViewModel(), never viewModel()
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) { ... }

// ✅ Scoped to NavGraph entry
@Composable
fun CheckoutFlow(navController: NavController) {
    val parentEntry = remember(navController) {
        navController.getBackStackEntry(CheckoutRoute)
    }
    val viewModel: CheckoutViewModel = hiltViewModel(parentEntry)
}
```

## Rule 5: @AndroidEntryPoint on all Android classes that inject

```kotlin
// ✅ Required on: Activity, Fragment, View, Service, BroadcastReceiver
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var analyticsTracker: AnalyticsTracker
}

@AndroidEntryPoint
class NotificationService : Service() {
    @Inject lateinit var notificationHandler: NotificationHandler
}

// ❌ Forgetting @AndroidEntryPoint — results in lateinit not initialized crash
class MainActivity : ComponentActivity() {
    @Inject lateinit var analyticsTracker: AnalyticsTracker  // CRASH: not injected
}
```

## Rule 6: @EntryPoint for non-Hilt classes

```kotlin
// ✅ Access Hilt graph from classes Hilt doesn't manage
@EntryPoint
@InstallIn(SingletonComponent::class)
interface AnalyticsEntryPoint {
    fun analyticsTracker(): AnalyticsTracker
}

// Usage in a ContentProvider or non-Hilt class
val entryPoint = EntryPointAccessors.fromApplication(
    context.applicationContext,
    AnalyticsEntryPoint::class.java
)
val tracker = entryPoint.analyticsTracker()
```

## Rule 7: @AssistedInject for runtime parameters

```kotlin
// ✅ When ViewModel needs a runtime value (e.g., item ID from nav args)
@HiltViewModel(assistedFactory = DetailViewModel.Factory::class)
class DetailViewModel @AssistedInject constructor(
    @Assisted val itemId: String,
    private val getItem: GetItemUseCase
) : ViewModel() {

    @AssistedFactory
    interface Factory {
        fun create(itemId: String): DetailViewModel
    }
}

// In Composable
@Composable
fun DetailScreen(itemId: String) {
    val viewModel: DetailViewModel = hiltViewModel<DetailViewModel, DetailViewModel.Factory>(
        creationCallback = { factory -> factory.create(itemId) }
    )
}
```

## Rule 8: Qualifier for multiple bindings of same type

```kotlin
// ✅ @Qualifier to distinguish between two instances of same type
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class IoDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class MainDispatcher

@Module
@InstallIn(SingletonComponent::class)
object DispatchersModule {
    @Provides @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides @MainDispatcher
    fun provideMainDispatcher(): CoroutineDispatcher = Dispatchers.Main
}

// Usage
@HiltViewModel
class MyViewModel @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ViewModel()
```

## Rule 9: Testing with Hilt

```kotlin
// ✅ @HiltAndroidTest for integration tests
@HiltAndroidTest
class HomeViewModelTest {
    @get:Rule val hiltRule = HiltAndroidRule(this)

    @Inject lateinit var getItems: GetItemsUseCase

    @Before
    fun setUp() { hiltRule.inject() }

    @Test
    fun `loads items successfully`() = runTest {
        val viewModel = HomeViewModel(getItems)
        viewModel.uiState.test {
            assertEquals(HomeUiState.Loading, awaitItem())
            assertTrue(awaitItem() is HomeUiState.Success)
        }
    }
}

// ✅ Replace production bindings in tests
@TestInstallIn(components = [SingletonComponent::class], replaces = [RepositoryModule::class])
@Module
abstract class FakeRepositoryModule {
    @Binds @Singleton
    abstract fun bindItemRepository(impl: FakeItemRepository): ItemRepository
}
```

## Rule 10: Common Dagger compile errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `[Dagger/MissingBinding]` | Missing @Provides / @Binds | Add module with binding |
| `[Dagger/IncompatiblyScopedBindings]` | Singleton injected into narrower scope | Match scopes or remove scope annotation |
| `abstract @Provides` | @Provides in abstract class | Use `object` for @Provides, `abstract class` for @Binds |
| `@Binds methods must have only one parameter` | Wrong @Binds signature | `abstract fun bind(impl: Impl): Interface` |
| `lateinit var not initialized` | Missing @AndroidEntryPoint | Add @AndroidEntryPoint to class |
| `Cannot be provided without @Inject or @Provides` | Interface binding missing | Add @Binds module |

## Deep-dive references

- `references/hilt-testing.md` — full test setup with @TestInstallIn and fake modules
- `references/hilt-workmanager.md` — @HiltWorker and WorkManager integration
