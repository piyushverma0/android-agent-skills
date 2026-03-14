---
name: kotlin-patterns
description: |
  Idiomatic Kotlin patterns for Android development. Use this skill when writing
  any Kotlin code for Android — coroutines, viewModelScope, lifecycleScope,
  Dispatchers, withContext, async/await, suspend functions, Flow, StateFlow,
  SharedFlow, stateIn, combine, flatMapLatest, debounce, sealed class, sealed
  interface, data class, Result, runCatching, null safety, !!, let, apply, also,
  run, with, lazy, extension functions, collection operators, or CoroutineExceptionHandler.
---

# Kotlin Patterns for Android

Production-complete Kotlin patterns. 14 rules across 7 categories, ordered by impact.

---

## CRITICAL — Coroutines

### Rule 1: Use the Correct Scope

```kotlin
class MyViewModel : ViewModel() {
    fun load() { viewModelScope.launch { ... } }         // ← auto-cancelled on VM clear
}
class MyFragment : Fragment() {
    override fun onViewCreated(...) {
        lifecycleScope.launch { viewModel.state.collect { render(it) } }
    }
}
@Composable fun Screen() {
    val scope = rememberCoroutineScope()
    Button(onClick = { scope.launch { doWork() } }) { Text("Go") }
}
suspend fun loadBoth() = coroutineScope {             // ← structured, waits for children
    val a = async { repository.getA() }
    val b = async { repository.getB() }
    a.await() to b.await()
}
// ❌ GlobalScope — leaks, no lifecycle     ❌ runBlocking — blocks thread, ANR risk
```

### Rule 2: Always Specify Dispatcher in Repository

```kotlin
// ✅ Inject dispatcher for testability
class ScanRepositoryImpl @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {
    override suspend fun getQuestions() = withContext(ioDispatcher) {
        supabase.from("questions").select().decodeList<Question>()
    }
}

withContext(Dispatchers.IO)      { /* network, database, file I/O */ }
withContext(Dispatchers.Default) { /* CPU-heavy: sorting, parsing */ }
// ❌ Dispatchers.IO directly in ViewModel — bypasses Repository
// ❌ Hardcoded Dispatchers in Repository — use @IoDispatcher qualifier for testing
```

### Rule 3: Exception Handling

```kotlin
// ✅ runCatching — for expected failures (network, parse errors)
fun solve(question: String) {
    viewModelScope.launch {
        runCatching { repository.scanSolve(question) }
            .onSuccess { _uiState.update { s -> s.copy(result = it) } }
            .onFailure { _uiState.update { s -> s.copy(errorMessage = it.message) } }
    }
}

// ✅ CoroutineExceptionHandler — for uncaught exceptions in launch
private val handler = CoroutineExceptionHandler { _, t ->
    _uiState.update { it.copy(errorMessage = t.message) }
}
viewModelScope.launch(handler) { riskyWork() }

// ✅ Never swallow CancellationException — rethrow it
try { delay(1000) } catch (e: CancellationException) { throw e } catch (e: Exception) { handle(e) }
// ❌ CoroutineExceptionHandler on async — doesn't work (exception deferred to await())
```

---

## CRITICAL — Flow

### Rule 4: StateFlow for UI State, SharedFlow for Events

```kotlin
// ✅ StateFlow — UI state (replays current value to new collectors)
private val _uiState = MutableStateFlow(QuestionListUiState())
val uiState: StateFlow<QuestionListUiState> = _uiState.asStateFlow()
_uiState.update { it.copy(isLoading = false, questions = newQuestions) }

// ✅ Convert cold Flow to hot StateFlow
val questions = repository.observeQuestions()
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
//                                                          ↑ 5s grace for config change

// ✅ SharedFlow — one-shot events (navigation, toasts — NEVER in UiState)
private val _events = MutableSharedFlow<AppEvent>()
val events: SharedFlow<AppEvent> = _events.asSharedFlow()
// Collect: LaunchedEffect(Unit) { viewModel.events.collect { ... } }

// ❌ SharedFlow for UI state — new collectors miss current value (blank screen)
// ❌ StateFlow for events — re-fires on rotation
// ❌ collectAsState — collects in background, wastes battery
// ✅ collectAsStateWithLifecycle — pauses when backgrounded
```

### Rule 5: Key Flow Operators

```kotlin
// flatMapLatest — cancel previous on new input (search boxes)
val results = searchQuery
    .debounce(300)
    .flatMapLatest { query -> repository.search(query) }

// combine — emit when EITHER flow emits (merging UI state)
val dashState = combine(questionsFlow, userFlow, quotaFlow) { q, u, quota ->
    DashboardUiState(questions = q, user = u, quota = quota)
}.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DashboardUiState())

// catch — handle errors without terminating the stream
repository.observeQuestions()
    .catch { error -> Timber.e(error); emit(emptyList()) }
    .stateIn(...)

// distinctUntilChanged — skip repeated equal emissions
uiState.map { it.isLoading }.distinctUntilChanged().collect { ... }

// flowOn — change upstream dispatcher
flow { emit(database.query()) }.flowOn(Dispatchers.IO)
```

---

## CRITICAL — Sealed Classes

### Rule 6: Sealed Interface for State and Events

```kotlin
// ✅ All states explicit — compiler forces exhaustive when
sealed interface UiState {
    object Loading : UiState
    data class Success(val data: List<Question>) : UiState
    data class Error(val message: String, val isRetryable: Boolean = true) : UiState
    object Empty : UiState
}

when (val state = uiState) {
    UiState.Loading    -> LoadingIndicator()
    is UiState.Success -> QuestionList(state.data)
    is UiState.Error   -> ErrorView(state.message, state.isRetryable)
    UiState.Empty      -> EmptyView()
}   // ← no else needed — compiler verifies exhaustiveness

// ✅ Result<T> for Repository returns
suspend fun scanSolve(q: String): Result<ScanSolveResponse> = runCatching {
    supabase.functions.invoke("scan-solve-question", ...).body()
}
// ❌ Nullable returns — null = not found OR error? Ambiguous.
// ❌ else in sealed when — silently skips new states added later
```

---

## HIGH — Data Classes

### Rule 7: All Val, Update via copy()

```kotlin
// ✅ Immutable data class — all val, defaults for optional fields
data class ScanUiState(
    val isLoading: Boolean = false,
    val result: ScanResult? = null,
    val errorMessage: String? = null
)

// ✅ Update via update{} + copy() — atomic, StateFlow detects change
_uiState.update { it.copy(isLoading = true, errorMessage = null) }

// ✅ Separate models for each layer
// QuestionDto    (@Serializable, matches DB)    ← data layer
// Question       (pure Kotlin domain model)     ← domain layer
// QuestionItem   (display model with formatted strings) ← UI layer
fun QuestionDto.toDomain() = Question(id, text, Subject.from(subject))

// ❌ var in data class — breaks StateFlow equality, enables unwanted mutation
// ❌ MutableList in data class — StateFlow won't detect changes
```

---

## HIGH — Null Safety

### Rule 8: Never !! — Safe Alternatives

```kotlin
// ❌ !! crashes with no context
val id = user!!.profile!!.id!!

// ✅ Safe call chain
val id = user?.profile?.id

// ✅ Elvis operator
val id = user?.profile?.id ?: return            // early exit
val id = user?.profile?.id ?: ""               // fallback
val id = user?.profile?.id
    ?: throw IllegalStateException("No authenticated user")

// ✅ requireNotNull — meaningful crash message (programming errors only)
val apiKey = requireNotNull(BuildConfig.API_KEY) { "API_KEY missing in local.properties" }

// ✅ let for nullable operations
user?.let { analytics.setUser(it.id, it.name) }

// ✅ Smart cast on val (not var)
val current = user
if (current != null) { process(current.id) }   // smart cast works on val
```

---

## MEDIUM — Scope Functions

### Rule 9: Right Function for Each Use Case

```kotlin
let  { it  → returns lambda result } // null check + transform
run  { this → returns lambda result } // init + return result (let + with combined)
apply{ this → returns receiver      } // object configuration during construction
also { it  → returns receiver       } // side effects in a chain (logging, analytics)
with(obj) { this → returns lambda } // multiple operations on existing non-null object

// ✅ apply — object setup
val intent = Intent(context, MainActivity::class.java).apply {
    putExtra("user_id", userId)
    flags = Intent.FLAG_ACTIVITY_NEW_TASK
}

// ✅ also — side effects
repository.getQuestions()
    .also { Timber.d("Loaded ${it.size} questions") }
    .filter { it.isActive }

// ✅ let — null-safe transform
val greeting = user?.let { "Hello, ${it.name}" } ?: "Hello, guest"

// ❌ Nested scope functions with unnamed 'it' — unreadable
user?.let { it.address?.let { it.city?.let { println(it) } } }  // ❌ which 'it'?
```

---

## MEDIUM — Collections

### Rule 10: Kotlin Collection Functions over Loops

```kotlin
// Transformation
val names = users.map { it.name }
val allTags = questions.flatMap { it.tags }
val validIds = responses.mapNotNull { it.id }          // map + filterNotNull
val bySubject = questions.groupBy { it.subject }       // Map<String, List<Question>>
val byId = questions.associateBy { it.id }             // Map<String, Question>

// Filtering
val (solved, unsolved) = questions.partition { it.isSolved }
val math = questions.firstOrNull { it.subject == "Math" }  // ← never first{} (throws)
val unique = questions.distinctBy { it.title }

// Aggregation
val total = questions.sumOf { it.expectedTimeSeconds }
val hasErrors = questions.any { it.hasError }
val allSolved = questions.all { it.isSolved }

// Safe access
val third = questions.getOrNull(2)      // null if out of bounds
val list = buildList {                  // idiomatic collection building
    if (includeMath) addAll(mathQuestions)
    if (includeScience) addAll(scienceQuestions)
}

// ❌ first{} without null check — throws NoSuchElementException
// ❌ Manual for loop for transformation — use map/filter/fold
```

---

## MEDIUM — Other Patterns

### Rule 11: lazy for Expensive Initialization

```kotlin
private val emailRegex by lazy { Regex("^[A-Za-z0-9+_.-]+@.+\\.[A-Za-z]{2,}$") }
private val dateFormatter by lazy { DateTimeFormatter.ofPattern("MMM dd, yyyy") }
// ❌ Eager init of heavy objects at class level — wastes memory if never used
```

### Rule 12: Extension Functions — Utilities on Types You Don't Own

```kotlin
fun Context.dpToPx(dp: Float): Int = (dp * resources.displayMetrics.density).toInt()
fun String.isValidEmail() = android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()
fun String?.orEmpty() = this ?: ""
fun Int.secondsToDisplayTime() = if (this < 60) "${this}s" else "${this / 60}m ${this % 60}s"
// ❌ Extension on Any — clutters all types
// ❌ Business logic in extension function — can't inject dependencies
// ❌ Extension on a class you own — just add the method directly
```

---

## References

- `references/flow-operators-reference.md` — Complete table of all Flow operators: transformation, filtering, combining, error handling, terminal, context operators. Read when choosing operators for complex Flow chains.
- `rules/` — 14 individual rule files with full examples, anti-patterns, and decision tables for each rule above.
