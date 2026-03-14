# StateFlow vs SharedFlow — Choose the Right Hot Flow

**Impact: CRITICAL**

Using SharedFlow for UI state causes missing updates on config change.
Using StateFlow for one-shot events causes them to re-fire on recomposition.

## Rule

### StateFlow — for UI state (always has a value, replays to new collectors)

```kotlin
// ✅ UI state — every screen needs exactly one StateFlow
private val _uiState = MutableStateFlow(QuestionListUiState())
val uiState: StateFlow<QuestionListUiState> = _uiState.asStateFlow()

// ✅ Update atomically — never read-modify-write separately
_uiState.update { current ->
    current.copy(isLoading = false, questions = newQuestions)
}

// ✅ Collect in Composable — always collectAsStateWithLifecycle
val uiState by viewModel.uiState.collectAsStateWithLifecycle()

// ✅ stateIn — convert cold Flow to hot StateFlow
val questions: StateFlow<List<Question>> = repository.observeQuestions()
    .stateIn(
        scope   = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),  // 5s grace on config change
        initialValue = emptyList()
    )
```

### SharedFlow — for one-shot events (navigation, toasts, snackbars)

```kotlin
// ✅ Events — zero replay, no initial value
private val _events = MutableSharedFlow<AppEvent>()
val events: SharedFlow<AppEvent> = _events.asSharedFlow()

sealed interface AppEvent {
    data class ShowError(val message: String) : AppEvent
    data class Navigate(val route: String)    : AppEvent
    object SessionExpired                     : AppEvent
}

fun onError(message: String) {
    viewModelScope.launch { _events.emit(AppEvent.ShowError(message)) }
}

// ✅ Collect in LaunchedEffect(Unit) — Unit is correct for hot flows
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is AppEvent.Navigate    -> navController.navigate(event.route)
            is AppEvent.ShowError   -> snackbarHost.showSnackbar(event.message)
            AppEvent.SessionExpired -> navController.navigate("login")
        }
    }
}
```

### SharingStarted options

```kotlin
SharingStarted.WhileSubscribed(5_000)
// ← stops upstream when no collectors for 5s
// ← 5s grace survives config change (rotation takes ~1-2s)
// ← use for: ViewModel StateFlows backed by DB/network

SharingStarted.Eagerly
// ← starts immediately, never stops
// ← use for: data that must always be fresh (auth state)

SharingStarted.Lazily
// ← starts on first collector, never stops
// ← rarely used in Android
```

## Anti-Patterns

```kotlin
// ❌ SharedFlow for UI state — new collectors miss the current value
private val _uiState = MutableSharedFlow<UiState>()  // ❌ no replay = blank screen on rotation

// ❌ StateFlow for one-shot events — re-fires on recomposition/rotation
data class UiState(val navigationDestination: String? = null)  // ❌
// rotation → new collector → reads navigationDestination again → navigates again

// ❌ collectAsState instead of collectAsStateWithLifecycle — collects in background
val state by viewModel.uiState.collectAsState()  // ❌ wastes battery

// ❌ WhileSubscribed with 0 timeout — cancels between config changes
SharingStarted.WhileSubscribed(0)  // ❌ upstream restarts on every rotation
// ✅
SharingStarted.WhileSubscribed(5_000)
```
