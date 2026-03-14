# Rule: One-shot UI events use SharedFlow
**Impact:** CRITICAL

Navigation/toast/snackbar events must be emitted as one-shot events, never persisted in `UiState`.

```kotlin
// ❌ Wrong — one-time event in state can replay after recreation.
data class WrongUiState(val showSnackbar: Boolean = false)

// ✅ Correct — SharedFlow for one-shot events.
sealed interface UiEvent {
    data class ShowSnackbar(val message: String) : UiEvent
}

class EventViewModel : ViewModel() {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    fun onSaved() {
        viewModelScope.launch { _events.emit(UiEvent.ShowSnackbar("Saved")) }
    }
}
```
