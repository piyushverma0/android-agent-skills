# Rule: Single UiState data class per screen
**Impact:** CRITICAL

Represent each screen with one immutable `UiState` exposed as `StateFlow`.

```kotlin
// ❌ Wrong — fragmented state across multiple flows.
class WrongViewModel : ViewModel() {
    val title = MutableStateFlow("")
    val isLoading = MutableStateFlow(false)
}

// ✅ Correct — one UiState object and lifecycle-aware collection.
data class HomeUiState(val title: String = "", val isLoading: Boolean = false)

class HomeViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
}

@Composable
fun HomeScreen(viewModel: HomeViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Text(text = state.title)
}
```
