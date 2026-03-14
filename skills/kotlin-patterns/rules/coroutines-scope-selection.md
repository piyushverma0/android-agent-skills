# Coroutine Scope — Always Use the Right Scope

**Impact: CRITICAL**

Using the wrong coroutine scope causes memory leaks, cancelled work at the
wrong time, or jobs that outlive their owner.

## Rule

```kotlin
// ✅ ViewModel — viewModelScope
// Auto-cancelled when ViewModel is cleared (navigation away, process death)
class QuestionViewModel : ViewModel() {
    fun loadQuestions() {
        viewModelScope.launch {
            val questions = repository.getQuestions()
            _uiState.update { it.copy(questions = questions) }
        }
    }
}

// ✅ Fragment / Activity — lifecycleScope
// Auto-cancelled when the Fragment/Activity is destroyed
class HomeFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        lifecycleScope.launch {
            viewModel.uiState.collect { state -> render(state) }
        }
    }
}

// ✅ Composable event handler — rememberCoroutineScope()
// Tied to the composition — cancelled when composable leaves
@Composable
fun ScanScreen() {
    val scope = rememberCoroutineScope()
    Button(onClick = { scope.launch { doWork() } }) { Text("Scan") }
}

// ✅ Suspend function needing child coroutines — coroutineScope {}
// Structured — parent waits for all children, cancels all on failure
suspend fun loadAll(): Pair<List<Question>, User> = coroutineScope {
    val questions = async { repository.getQuestions() }
    val user = async { repository.getUser() }
    questions.await() to user.await()
}

// ✅ Background work that must complete even if caller cancels — NonCancellable
suspend fun saveResult(result: ScanResult) {
    withContext(NonCancellable) {
        database.save(result)   // must complete even if ViewModel is cleared
    }
}
```

## Anti-Patterns

```kotlin
// ❌ GlobalScope — leaks, outlives everything, no structured concurrency
GlobalScope.launch { repository.loadData() }

// ❌ CoroutineScope(Dispatchers.IO) manually in ViewModel — leaks on clear
class WrongViewModel : ViewModel() {
    private val scope = CoroutineScope(Dispatchers.IO)   // ❌ never cancelled
    fun load() { scope.launch { ... } }
}

// ❌ lifecycleScope in ViewModel — wrong owner
class WrongViewModel(private val fragment: Fragment) : ViewModel() {
    fun load() { fragment.lifecycleScope.launch { ... } }  // ❌ ViewModel holds Fragment ref
}

// ❌ runBlocking in production — blocks the calling thread
fun loadSync() = runBlocking { repository.getQuestions() }  // ❌ ANR risk on main thread
```

## Scope Decision Table

| Where | Scope | Cancelled when |
|---|---|---|
| ViewModel | `viewModelScope` | ViewModel cleared |
| Fragment / Activity | `lifecycleScope` | View destroyed |
| Composable handler | `rememberCoroutineScope()` | Composable leaves composition |
| Suspend function parallel | `coroutineScope {}` | Parent cancelled or child fails |
| Must-complete work | `withContext(NonCancellable)` | Never (use sparingly) |
