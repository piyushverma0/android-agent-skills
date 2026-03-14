# Never Run Business Logic or Heavy Computation Directly in Composition

**Impact: CRITICAL**

Code written directly in a composable body runs on **every recomposition**.
Sorting, filtering, network calls, and database queries in composition create
performance cliffs and side effects.

## Rule

Move all computation and business logic to the ViewModel.
For cheap local derivations, wrap in `remember(input) { }`.

```kotlin
// ❌ Wrong — sorts on every recomposition (can be thousands of times)
@Composable
fun QuestionList(questions: List<Question>) {
    val sorted   = questions.sortedBy { it.difficulty }       // ❌
    val filtered = sorted.filter { it.subject == "Math" }     // ❌
    LazyColumn { items(filtered, key = { it.id }) { QuestionCard(it) } }
}

// ✅ Correct — move to ViewModel, emit sorted/filtered via StateFlow
class QuestionViewModel @Inject constructor(repo: QuestionRepository) : ViewModel() {
    val sortedQuestions = repo.getQuestions()
        .map { list -> list.sortedBy { it.difficulty }.filter { it.subject == "Math" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
}

// ✅ For simple LOCAL derivation that doesn't need ViewModel — remember with input key
@Composable
fun QuestionList(questions: List<Question>, filterSubject: String) {
    val filtered = remember(questions, filterSubject) {
        questions.filter { it.subject == filterSubject }  // only runs when inputs change
    }
    LazyColumn { items(filtered, key = { it.id }) { QuestionCard(it) } }
}

// ❌ Wrong — calling suspend function directly in composition
@Composable
fun ProfileScreen(userId: String) {
    viewModel.loadProfile(userId)   // ❌ called on EVERY recomposition
}

// ✅ Correct — side effect keyed on userId
@Composable
fun ProfileScreen(userId: String, viewModel: ProfileViewModel = hiltViewModel()) {
    LaunchedEffect(userId) { viewModel.loadProfile(userId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    ProfileContent(uiState)
}
```

## Recomposition Triggers

Understanding what causes recomposition helps avoid accidental computation:

```kotlin
// These trigger recomposition of any composable that reads them:
// - State reads (mutableStateOf, StateFlow collected with collectAsStateWithLifecycle)
// - Parameter changes passed from parent
// - CompositionLocal changes

// ✅ Stable parameters prevent recomposition
@Stable  // mark your data classes as @Stable when all fields are val
data class Question(val id: String, val text: String, val difficulty: String)

// ✅ Immutable collections prevent recomposition on same data
// Use kotlinx.collections.immutable for lists passed to composables
val questions: ImmutableList<Question> = persistentListOf(...)
```
