# Use SharedFlow for One-Shot Events — Never Store Them in UiState

**Impact: CRITICAL**

Storing navigation events, toast messages, or snackbar triggers in `UiState`
causes them to re-fire on recomposition or config change.
One-shot events must flow through `SharedFlow` and never be re-played.

## Rule

```kotlin
// ✅ Define one-shot events as a sealed interface
sealed interface ScanEvent {
    data class ShowError(val message: String)  : ScanEvent
    data class Navigate(val route: String)     : ScanEvent
    data class ShowSnackbar(val message: String, val actionLabel: String? = null) : ScanEvent
    object QuotaExhausted                      : ScanEvent
    object ScanComplete                        : ScanEvent
}

// ✅ In ViewModel — SharedFlow with no replay
class ScanViewModel @Inject constructor(...) : ViewModel() {

    private val _events = MutableSharedFlow<ScanEvent>()
    val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

    private fun emitEvent(event: ScanEvent) {
        viewModelScope.launch { _events.emit(event) }
    }

    fun onSolveComplete(result: ScanSolveResponse) {
        _uiState.update { it.copy(isSolving = false, result = result) }
        emitEvent(ScanEvent.ScanComplete)   // one-shot — won't replay on recompose
    }

    fun onSolveError(error: Throwable) {
        _uiState.update { it.copy(isSolving = false) }
        emitEvent(ScanEvent.ShowError(error.message ?: "Unexpected error"))
    }
}

// ✅ In Composable — collect in LaunchedEffect(Unit) — Unit is correct here
// because the Flow is already hot (SharedFlow) — we just need to collect it once
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is ScanEvent.Navigate      -> navController.navigate(event.route)
            is ScanEvent.ShowError     -> snackbarHostState.showSnackbar(event.message)
            is ScanEvent.ShowSnackbar  -> snackbarHostState.showSnackbar(
                message     = event.message,
                actionLabel = event.actionLabel
            )
            ScanEvent.QuotaExhausted   -> navController.navigate(Screen.Upgrade.route)
            ScanEvent.ScanComplete     -> { /* handle */ }
        }
    }
}
```

## Anti-Pattern: Events Stored in UiState

```kotlin
// ❌ Wrong — event stored in UiState re-fires on rotation/recomposition
data class WrongUiState(
    val navigationDestination: String? = null,  // ❌ fires again on config change
    val toastMessage: String? = null,           // ❌ shows again after rotation
    val shouldNavigateBack: Boolean = false     // ❌ same problem
)

// ❌ Even with "consumed" pattern it's fragile
_uiState.update { it.copy(navigationDestination = "scan_result") }
// consumer calls:
_uiState.update { it.copy(navigationDestination = null) }
// Problem: race condition if two events fire quickly
```

## SharedFlow vs StateFlow for Events

| | StateFlow | SharedFlow |
|---|---|---|
| Replay last value | ✅ Always | ❌ Default: 0 |
| Initial value required | ✅ Yes | ❌ No |
| Use for | UI state | One-shot events |
| Collect on config change | Gets latest value | Gets no replay |
