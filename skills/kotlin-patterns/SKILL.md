---
name: kotlin-patterns
description: |
  Idiomatic Kotlin patterns for Android AI agents. Use this skill whenever writing Kotlin
  code for Android, especially: coroutines, Flow, StateFlow, SharedFlow, viewModelScope,
  lifecycleScope, Dispatchers, withContext, suspend functions, sealed classes, sealed interfaces,
  data classes, extension functions, scope functions (let, apply, also, run, with), null safety,
  !! operator, runCatching, Result, lazy, by delegate, stateIn, flatMapLatest, combine,
  error handling, structured concurrency, or any Kotlin-specific patterns. Always apply
  before writing coroutines, Flow chains, or data modeling code.
---

# Kotlin Patterns for Android

12 rules for idiomatic, production-safe Kotlin on Android.

## Rule 1: Coroutine scope — always use structured concurrency

```kotlin
// ✅ viewModelScope — auto-cancelled when ViewModel is cleared
class MyViewModel : ViewModel() {
    fun load() {
        viewModelScope.launch {
            val result = fetchData()   // suspend, cancellable
        }
    }
}

// ✅ lifecycleScope — tied to Activity/Fragment lifecycle
class MyActivity : ComponentActivity() {
    override fun onStart() {
        super.onStart()
        lifecycleScope.launch {
            viewModel.events.collect { handleEvent(it) }
        }
    }
}

// ❌ GlobalScope — not structured, leaks, not cancellable
GlobalScope.launch { fetchData() }

// ❌ CoroutineScope(Dispatchers.IO) without proper lifecycle binding
val scope = CoroutineScope(Dispatchers.IO)
scope.launch { fetchData() }  // never cancelled
```

## Rule 2: Dispatcher discipline — always switch off Main

```kotlin
// ✅ IO-bound work: switch to IO dispatcher
suspend fun fetchUser(id: String): User = withContext(Dispatchers.IO) {
    api.getUser(id)
}

// ✅ CPU-intensive work: use Default dispatcher
suspend fun processLargeList(items: List<Item>): List<Result> = withContext(Dispatchers.Default) {
    items.map { processItem(it) }
}

// ✅ Inject dispatcher for testability
class UserRepository @Inject constructor(
    private val api: UserApi,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) {
    suspend fun getUser(id: String): User = withContext(dispatcher) {
        api.getUser(id)
    }
}

// ❌ Network call on Main thread — crashes with NetworkOnMainThreadException
suspend fun fetchUser(): User = api.getUser()  // on Main, wrong
```

## Rule 3: StateFlow — expose, never expose MutableStateFlow

```kotlin
// ✅ Mutable private, immutable public
private val _uiState = MutableStateFlow(HomeUiState.Loading)
val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

// ✅ Update state correctly
_uiState.value = HomeUiState.Success(items)          // from coroutine on Main
_uiState.update { current -> current.copy(isLoading = false) }  // thread-safe update

// ❌ Exposing MutableStateFlow — external code can change state
val uiState = MutableStateFlow(HomeUiState.Loading)  // anyone can set this
```

## Rule 4: stateIn — convert cold Flow to StateFlow

```kotlin
// ✅ stateIn with correct parameters
val items: StateFlow<List<Item>> = repository.getItemsFlow()
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),  // 5s timeout before cancelling
        initialValue = emptyList()
    )

// ✅ WhileSubscribed(5000) — keeps upstream alive 5s after last subscriber
// This handles configuration changes without re-fetching
```

## Rule 5: runCatching — safe error handling without try/catch

```kotlin
// ✅ runCatching wraps any exception in Result<T>
suspend fun getItems(): Result<List<Item>> = runCatching {
    api.getItems().map { it.toDomain() }
}

// ✅ Chain Result transformations
suspend fun getActiveItems(): Result<List<Item>> =
    getItems()
        .map { items -> items.filter { it.isActive } }
        .onFailure { error -> logger.e(error, "Failed to get items") }

// ✅ In ViewModel
viewModelScope.launch {
    getItems()
        .onSuccess { items -> _uiState.value = HomeUiState.Success(items) }
        .onFailure { error -> _uiState.value = HomeUiState.Error(error.message ?: "Error") }
}

// ❌ Try/catch scattered through ViewModel — inconsistent, hard to compose
try {
    val items = api.getItems()
    _uiState.value = HomeUiState.Success(items)
} catch (e: Exception) {
    _uiState.value = HomeUiState.Error(e.message ?: "Error")
}
```

## Rule 6: Sealed interfaces — prefer over sealed classes for state/events

```kotlin
// ✅ sealed interface — no constructor, lighter, more composable
sealed interface LoginResult {
    data object Success : LoginResult
    data class Error(val code: Int, val message: String) : LoginResult
    data object NetworkError : LoginResult
}

// ✅ sealed interface allows a class to implement multiple sealed hierarchies
class AuthError : LoginResult.Error(401, "Unauthorized"), ProfileResult.Unauthorized

// ❌ sealed class — requires a superclass constructor
sealed class LoginResult {
    object Success : LoginResult()
    data class Error(val message: String) : LoginResult()
}
```

## Rule 7: Scope functions — use the right one

```kotlin
// ✅ let — transform nullable value, chain operations
val length = name?.let { it.trim().length } ?: 0

// ✅ apply — configure an object, return the object
val intent = Intent(context, MainActivity::class.java).apply {
    putExtra("id", itemId)
    flags = Intent.FLAG_ACTIVITY_NEW_TASK
}

// ✅ also — side effects, return the same object
val items = repository.getItems().also { logger.d("Loaded ${it.size} items") }

// ✅ run — execute block, return result (combine let + with)
val message = user.run {
    if (isPremium) "Welcome, Premium $name!" else "Welcome, $name!"
}

// ✅ with — call multiple methods on an object, return result
val summary = with(order) {
    "Order #$id: $itemCount items, total: $$total"
}

// ❌ Nested let/run — unreadable, use named functions instead
val result = a?.let { b?.let { c?.run { ... } } }  // pyramid of doom
```

## Rule 8: No !! operator in production code

```kotlin
// ✅ Safe alternatives to !!
val name = user?.name ?: "Anonymous"          // Elvis operator
val id = savedStateHandle.get<String>("id") ?: return  // early return
val file = getFile() ?: throw IllegalStateException("File required")  // explicit throw

// ✅ requireNotNull with message
val config = requireNotNull(buildConfig) { "BuildConfig must be initialized before use" }

// ❌ !! crashes with NullPointerException — never use in production
val name = user!!.name   // NPE if user is null
val id = args!!.getString("id")  // NPE in production
```

## Rule 9: flatMapLatest — cancel previous on new emission

```kotlin
// ✅ flatMapLatest cancels in-flight request when new search query arrives
val searchResults: StateFlow<List<Item>> = searchQuery
    .debounce(300L)
    .flatMapLatest { query ->
        if (query.isBlank()) flowOf(emptyList())
        else repository.search(query)
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

// ❌ flatMapMerge — all emissions run concurrently, results arrive out of order
val searchResults = searchQuery.flatMapMerge { repository.search(it) }
```

## Rule 10: Data classes — correct usage

```kotlin
// ✅ data class for value objects with meaningful equality
data class Item(
    val id: String,
    val title: String,
    val description: String,
    val createdAt: Instant
)

// ✅ copy() for immutable updates
val updated = item.copy(title = "New Title", description = "Updated")

// ✅ data object for singletons in sealed hierarchies
sealed interface AuthState {
    data object Unauthenticated : AuthState
    data object Loading : AuthState
    data class Authenticated(val user: User) : AuthState
}

// ❌ Regular class for domain models — loses equals/hashCode/copy
class Item(val id: String, val title: String)  // no equals, no copy

// ❌ Mutable data class — breaks StateFlow comparison, causes missed updates
data class UiState(var isLoading: Boolean = false)  // var in data class
```

## Rule 11: Lazy initialization

```kotlin
// ✅ by lazy — compute once, reuse, thread-safe by default
val regex: Regex by lazy { Regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$") }

// ✅ lateinit var — for dependency injection and test setup
@Inject lateinit var repository: ItemRepository

// ✅ lateinit with isInitialized check when needed
if (::repository.isInitialized) repository.close()

// ❌ lazy without thread-safety consideration in concurrent contexts
val cache by lazy(LazyThreadSafetyMode.NONE) { mutableMapOf<String, Item>() }
// LazyThreadSafetyMode.NONE is only safe if accessed from single thread
```

## Rule 12: Extension functions — don't abuse them

```kotlin
// ✅ Extension for adding behavior to existing types
fun String.isValidEmail(): Boolean =
    android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()

fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    Toast.makeText(this, message, duration).show()
}

fun <T> Flow<T>.throttleFirst(windowDuration: Long): Flow<T> = flow {
    var lastEmission = 0L
    collect { value ->
        val now = System.currentTimeMillis()
        if (now - lastEmission >= windowDuration) {
            lastEmission = now
            emit(value)
        }
    }
}

// ❌ Extension that should be a UseCase — logic belongs in domain
fun List<Item>.filterAndSort(): List<Item> {
    // business logic in extension = untestable, not reusable across modules
    return filter { it.isActive }.sortedBy { it.title }
}
```

## Common Mistakes Quick Reference

| ❌ Wrong | ✅ Right |
|---|---|
| `GlobalScope.launch` | `viewModelScope.launch` |
| `user!!.name` | `user?.name ?: "default"` |
| `collectAsState()` | `collectAsStateWithLifecycle()` |
| `MutableStateFlow` exposed | `_private.asStateFlow()` |
| Try/catch in ViewModel | `runCatching` in Repository |
| `var` in `data class` | `val` — immutable |
| `flatMapMerge` for search | `flatMapLatest` |
| Computation on Main | `withContext(Dispatchers.IO)` |
