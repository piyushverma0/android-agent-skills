# @HiltViewModel — ViewModels with Dependency Injection

**Impact: CRITICAL**

Creating ViewModels manually with `ViewModelProvider.Factory` when using Hilt
is unnecessary boilerplate. `@HiltViewModel` + `hiltViewModel()` handles everything.

## Rule

### 1. Standard @HiltViewModel

```kotlin
// ✅ ViewModel — annotate with @HiltViewModel, inject via constructor
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val scanRepository: ScanRepository,
    private val userRepository: UserRepository,
    private val savedStateHandle: SavedStateHandle   // ← Hilt provides this automatically
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    // Read nav args from SavedStateHandle (type-safe)
    private val questionId: String = savedStateHandle["questionId"]
        ?: error("questionId required")
}

// ✅ In Composable — always use hiltViewModel()
@Composable
fun ScanScreen(
    viewModel: ScanViewModel = hiltViewModel()   // ← Hilt creates and scopes automatically
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // ...
}
```

### 2. Shared ViewModel scoped to navigation graph

```kotlin
// ✅ Share ViewModel between multiple screens in a nav graph
@Composable
fun CheckoutScreenA(navController: NavController) {
    val parentEntry = remember(navController) {
        navController.getBackStackEntry("checkout_graph")   // ← graph route
    }
    val sharedViewModel: CheckoutViewModel = hiltViewModel(parentEntry)
}

@Composable
fun CheckoutScreenB(navController: NavController) {
    val parentEntry = remember(navController) {
        navController.getBackStackEntry("checkout_graph")
    }
    val sharedViewModel: CheckoutViewModel = hiltViewModel(parentEntry)
    // ← same instance as CheckoutScreenA
}
```

### 3. SavedStateHandle for nav args and process death recovery

```kotlin
// ✅ Read nav arguments from SavedStateHandle — survives process death
@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: ProductRepository
) : ViewModel() {

    // From navArgument("productId") in NavHost
    private val productId: String = checkNotNull(savedStateHandle["productId"])

    val product = repository.getProduct(productId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    // ✅ Persist UI state across process death
    var searchQuery by savedStateHandle.saveable { mutableStateOf("") }
}
```

### 4. @HiltViewModel with multiple constructors — use @Inject on one

```kotlin
// ✅ Exactly one constructor must be annotated @Inject
@HiltViewModel
class SearchViewModel @Inject constructor(   // ← only one @Inject
    private val repository: SearchRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel()
```

## Anti-Patterns

```kotlin
// ❌ Manual ViewModelProvider.Factory — unnecessary with Hilt
class WrongFactory(private val repo: ScanRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T =
        ScanViewModel(repo) as T
}

// ❌ ViewModelProvider() — bypasses Hilt injection
val viewModel = ViewModelProvider(this)[ScanViewModel::class.java]  // ❌
// ✅
val viewModel: ScanViewModel = hiltViewModel()

// ❌ @Singleton ViewModel — ViewModels must not be singletons
@Singleton @HiltViewModel   // ❌ compile error — incompatible scopes
class WrongViewModel @Inject constructor() : ViewModel()

// ❌ Injecting Activity/Fragment into ViewModel — memory leak
@HiltViewModel
class WrongViewModel @Inject constructor(
    private val activity: MainActivity   // ❌ ViewModel outlives Activity
) : ViewModel()
```
