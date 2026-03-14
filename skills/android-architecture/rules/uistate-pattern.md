# UiState Pattern — Single Data Class Per Screen

**Impact: CRITICAL**

Multiple StateFlows per screen cause race conditions and partial UI updates.
The entire screen state must be atomic — one data class, one StateFlow.

## Rule

### 1. One data class, all defaults, all val

```kotlin
// ✅ Single data class captures every possible screen state
data class ScanUiState(
    // Async state
    val isLoading: Boolean = false,
    val isSolving: Boolean = false,
    val processingMessage: String = "",
    // Data
    val result: ScanSolveResponse? = null,
    val questions: List<Question> = emptyList(),
    val remainingScans: Int = 5,
    // Error — nullable, cleared after displayed
    val errorMessage: String? = null,
    // UI preferences
    val selectedMode: ScanMode = ScanMode.GENERAL,
    val isSuperAiEnabled: Boolean = false
)
```

### 2. Single StateFlow in ViewModel

```kotlin
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val repository: ScanRepository
) : ViewModel() {

    // ✅ One MutableStateFlow, exposed as immutable StateFlow
    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    // ✅ Atomic update via update{} — thread-safe, single emission
    fun onModeSelected(mode: ScanMode) {
        _uiState.update { it.copy(selectedMode = mode) }
    }

    fun solve(imageBase64: String, mimeType: String) {
        if (_uiState.value.isSolving) return   // ← guard against double-tap
        viewModelScope.launch {
            _uiState.update { it.copy(isSolving = true, errorMessage = null) }
            repository.scanSolve(imageBase64, mimeType, _uiState.value.selectedMode)
                .onSuccess { result ->
                    _uiState.update { it.copy(isSolving = false, result = result) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isSolving = false, errorMessage = error.message) }
                }
        }
    }

    fun clearError()  { _uiState.update { it.copy(errorMessage = null) } }
    fun clearResult() { _uiState.update { it.copy(result = null) } }
}
```

### 3. Collect in Composable with lifecycle awareness

```kotlin
// ✅ collectAsStateWithLifecycle — pauses when backgrounded
@Composable
fun ScanScreen(viewModel: ScanViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Render each state
    when {
        uiState.isSolving -> SolvingIndicator(uiState.processingMessage)
        uiState.result != null -> ResultSheet(uiState.result!!)
        else -> ScanContent(uiState)
    }

    // Error handling
    uiState.errorMessage?.let { error ->
        LaunchedEffect(error) {
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }
}
```

### 4. UiState for lists — loading + content + empty + error

```kotlin
// ✅ All states explicit in one data class
data class QuestionListUiState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val questions: List<Question> = emptyList(),
    val errorMessage: String? = null
) {
    // Computed property — no stored state needed
    val isEmpty: Boolean get() = !isLoading && questions.isEmpty() && errorMessage == null
}
```

## Anti-Patterns

```kotlin
// ❌ Multiple StateFlows — UI can be in inconsistent intermediate states
class WrongViewModel : ViewModel() {
    val isLoading = MutableStateFlow(false)   // ❌
    val result    = MutableStateFlow<Result?>(null)  // ❌
    val error     = MutableStateFlow<String?>(null)  // ❌
    // isLoading=false + result=null + error=null — are we idle or failed?
}

// ❌ var in UiState — StateFlow won't detect mutation
data class WrongState(var isLoading: Boolean = false)  // ❌
_uiState.value.isLoading = true  // ❌ no emission triggered

// ❌ collectAsState — collects in background, drains battery
val state by viewModel.uiState.collectAsState()  // ❌
```
