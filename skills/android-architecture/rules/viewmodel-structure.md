# ViewModel Structure — Responsibilities and Boundaries

**Impact: CRITICAL**

ViewModels that do too much (network calls, UI logic, navigation) and ViewModels
that do too little (just passing through repository results) both indicate
architectural problems.

## Rule

### A ViewModel's exact responsibilities

```
✅ ViewModel IS responsible for:
- Holding UiState as StateFlow
- Emitting one-shot events as SharedFlow
- Calling Repository methods and handling Result<T>
- Transforming domain models to UI models
- Enforcing business rules before delegating to Repository
- Surviving configuration changes (rotation)
- Managing loading/error states

❌ ViewModel is NOT responsible for:
- Making network calls directly (that's Repository)
- Showing UI (that's Composable)
- Navigation logic (emit event, let UI handle it)
- Database queries directly (that's Repository)
- Context references (causes memory leaks)
```

### Complete ViewModel structure

```kotlin
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val scanRepository: ScanRepository,
    private val userRepository: UserRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // ── State ─────────────────────────────────────────────────────────────
    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    // ── Events (one-shot) ─────────────────────────────────────────────────
    private val _events = MutableSharedFlow<ScanEvent>()
    val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

    // ── Init — load data that the screen always needs ─────────────────────
    init {
        loadQuota()
    }

    private fun loadQuota() {
        viewModelScope.launch {
            userRepository.getQuota()
                .onSuccess { quota ->
                    _uiState.update { it.copy(remainingScans = quota.remaining) }
                }
        }
    }

    // ── Public actions — called by UI ──────────────────────────────────────
    fun onModeSelected(mode: ScanMode) {
        _uiState.update { it.copy(selectedMode = mode) }
    }

    fun onSuperAiToggled(enabled: Boolean) {
        _uiState.update { it.copy(isSuperAiEnabled = enabled) }
    }

    fun solveCapturedImage(imageBase64: String, mimeType: String) {
        // ✅ Guard: prevent duplicate calls
        if (_uiState.value.isSolving) return
        // ✅ Guard: check quota before making the call
        if (_uiState.value.remainingScans <= 0) {
            viewModelScope.launch { _events.emit(ScanEvent.QuotaExhausted(0)) }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSolving = true, errorMessage = null) }

            scanRepository.scanSolveQuestion(
                questionText = null,
                imageBase64 = imageBase64,
                mimeType = mimeType,
                mode = _uiState.value.selectedMode.value,
                isSuperAi = _uiState.value.isSuperAiEnabled
            ).onSuccess { result ->
                _uiState.update { it.copy(
                    isSolving = false,
                    result = result,
                    remainingScans = result.remainingScans
                )}
            }.onFailure { error ->
                _uiState.update { it.copy(isSolving = false) }
                when (error) {
                    is QuotaExhaustedException ->
                        _events.emit(ScanEvent.QuotaExhausted(error.remaining))
                    is AuthException ->
                        _events.emit(ScanEvent.SessionExpired)
                    else ->
                        _events.emit(ScanEvent.ShowError(error.message ?: "Solve failed"))
                }
            }
        }
    }

    // ── State clearers ────────────────────────────────────────────────────
    fun clearError()  { _uiState.update { it.copy(errorMessage = null) } }
    fun clearResult() { _uiState.update { it.copy(result = null) } }
}
```

### Derived StateFlow — combine multiple sources

```kotlin
// ✅ Combine repository flows into one StateFlow for the screen
val uiState: StateFlow<HomeUiState> = combine(
    userRepository.observeCurrentUser(),
    questionRepository.observeQuestions(),
    quotaRepository.observeQuota()
) { user, questions, quota ->
    HomeUiState(
        userName      = user?.name ?: "Guest",
        questions     = questions,
        remainingScans = quota.remaining,
        isPremium     = quota.isPremium
    )
}.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5_000),
    initialValue = HomeUiState()
)
```

## Anti-Patterns

```kotlin
// ❌ Network call in ViewModel — bypasses Repository
class WrongViewModel : ViewModel() {
    fun load() = viewModelScope.launch {
        supabase.from("questions").select().decodeList<Question>()  // ❌
    }
}

// ❌ Context in ViewModel — memory leak (Context holds Activity reference)
class WrongViewModel(private val context: Context) : ViewModel()  // ❌

// ❌ Exposing MutableStateFlow publicly — UI can mutate state directly
val uiState = MutableStateFlow(ScanUiState())  // ❌ public mutable
// ✅
private val _uiState = MutableStateFlow(ScanUiState())
val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

// ❌ No guard on loading — double-tap causes duplicate network calls
fun solve() {
    viewModelScope.launch {
        repository.scan()  // ❌ called again if user taps twice
    }
}
// ✅ if (_uiState.value.isSolving) return
```
