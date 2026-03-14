# Use a Single UiState Data Class Per Screen

**Impact: CRITICAL**

Multiple `StateFlow`s per screen cause race conditions, partial UI updates, and
make it impossible to reason about the screen's state atomically.

## Rule

Every screen gets exactly **one** `data class` for its UI state, exposed as a
single `StateFlow` from the ViewModel.

```kotlin
// ✅ Single data class — atomic, copyable, testable
data class ScanUiState(
    val isSolving: Boolean = false,
    val result: ScanSolveResponse? = null,
    val errorMessage: String? = null,
    val processingMessage: String = "",
    val remainingScans: Int = 5,
    val selectedMode: ScanMode = ScanMode.GENERAL,
    val isSuperAiEnabled: Boolean = false
)

// ✅ Single MutableStateFlow in ViewModel
class ScanViewModel @Inject constructor(...) : ViewModel() {
    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    // Always update atomically with update{}
    fun onSolveStart() {
        _uiState.update { it.copy(isSolving = true, errorMessage = null) }
    }
}

// ✅ In Composable — collectAsStateWithLifecycle (not collectAsState)
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

## Why collectAsStateWithLifecycle, Not collectAsState

`collectAsStateWithLifecycle` pauses collection when the app enters the background,
saving battery and preventing background work. `collectAsState` collects always —
even when the screen is invisible.

```kotlin
// ❌ Collects in background — wastes battery
val uiState by viewModel.uiState.collectAsState()

// ✅ Pauses when app backgrounded
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

## Anti-Pattern: Multiple StateFlows

```kotlin
// ❌ Multiple flows — UI can be in inconsistent intermediate state
class WrongViewModel : ViewModel() {
    val isLoading = MutableStateFlow(false)
    val result = MutableStateFlow<Result?>(null)
    val error = MutableStateFlow<String?>(null)
    // Problem: isLoading=false and result=null and error=null at the same time
    // is ambiguous — is it initial state or completed with no data?
}
```
