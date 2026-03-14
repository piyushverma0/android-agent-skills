# UiEvent Pattern — One-Shot Events via SharedFlow

**Impact: CRITICAL**

Navigation, snackbars, and toasts are one-shot events. Storing them in UiState
causes re-firing on rotation, back stack restoration, or recomposition.
They must flow through SharedFlow with zero replay.

## Rule

### 1. Define events as sealed interface

```kotlin
// ✅ Every event carries exactly the data it needs — no more, no less
sealed interface ScanEvent {
    data class ShowError(val message: String)             : ScanEvent
    data class Navigate(val route: String)                : ScanEvent
    data class ShowSnackbar(
        val message: String,
        val actionLabel: String? = null
    )                                                     : ScanEvent
    data class QuotaExhausted(val remaining: Int)         : ScanEvent
    object SessionExpired                                 : ScanEvent
    object ScanComplete                                   : ScanEvent
}
```

### 2. Emit from ViewModel via MutableSharedFlow

```kotlin
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val repository: ScanRepository
) : ViewModel() {

    // ✅ SharedFlow with replay = 0 — events are NOT replayed to new collectors
    private val _events = MutableSharedFlow<ScanEvent>()
    val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

    // ✅ Helper to emit from any function
    private fun emit(event: ScanEvent) {
        viewModelScope.launch { _events.emit(event) }
    }

    fun onSolveComplete(result: ScanSolveResponse) {
        _uiState.update { it.copy(isSolving = false, result = result) }
        emit(ScanEvent.ScanComplete)
    }

    fun onSolveError(error: Throwable) {
        _uiState.update { it.copy(isSolving = false) }
        when (error) {
            is QuotaException  -> emit(ScanEvent.QuotaExhausted(error.remaining))
            is AuthException   -> emit(ScanEvent.SessionExpired)
            else               -> emit(ScanEvent.ShowError(error.message ?: "Unexpected error"))
        }
    }
}
```

### 3. Collect in Composable — LaunchedEffect(Unit) for hot flows

```kotlin
// ✅ LaunchedEffect(Unit) — correct for SharedFlow (hot, never re-fires)
@Composable
fun ScanScreen(viewModel: ScanViewModel = hiltViewModel()) {
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is ScanEvent.Navigate      -> navController.navigate(event.route)
                is ScanEvent.ShowError     -> snackbarHostState.showSnackbar(event.message)
                is ScanEvent.ShowSnackbar  -> snackbarHostState.showSnackbar(
                    message     = event.message,
                    actionLabel = event.actionLabel
                )
                is ScanEvent.QuotaExhausted -> navController.navigate(Screen.Upgrade.route)
                ScanEvent.SessionExpired    -> navController.navigate(Screen.Login.route) {
                    popUpTo(Screen.Home.route) { inclusive = true }
                }
                ScanEvent.ScanComplete -> { /* optional — UiState already updated */ }
            }
        }
    }
}
```

### 4. Events vs UiState — decision guide

```
Store in UiState when:        Use SharedFlow event when:
✅ Screen needs to SHOW it    ✅ It happens ONCE and is done
✅ Survives rotation          ✅ Navigation
✅ Multiple widgets read it   ✅ Toast / Snackbar
✅ Can be in multiple states  ✅ Dialog trigger
                              ✅ Vibration / sound
                              ✅ System UI action
```

## Anti-Patterns

```kotlin
// ❌ Navigation stored in UiState — navigates again on rotation
data class WrongState(
    val navigationDestination: String? = null   // ❌ re-read after rotation
)
// Rotation → new collector reads navigationDestination → navigates again

// ❌ "Consumed" flag pattern — race condition with two rapid events
_uiState.update { it.copy(navigationDestination = "scan_result") }
// consumer:
_uiState.update { it.copy(navigationDestination = null) }
// ❌ two events fire before consumer clears → second event lost

// ❌ Channel instead of SharedFlow — buffer causes missed events on fast emissions
private val _events = Channel<ScanEvent>(capacity = Channel.BUFFERED)  // ❌
// ✅ MutableSharedFlow with replay = 0

// ❌ LaunchedEffect(errorMessage) for SharedFlow — SharedFlow is hot, not keyed
LaunchedEffect(viewModel.errorMessage) { collect() }   // ❌ use LaunchedEffect(Unit)
```
