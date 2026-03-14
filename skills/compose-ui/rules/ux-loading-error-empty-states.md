# Rule: Always model Loading/Error/Empty/Success states
**Impact:** CRITICAL

Every screen must support full UX state coverage and recovery actions.

```kotlin
// ❌ Wrong — success only, no loading/error/empty handling.
@Composable
fun WrongFeed(items: List<String>) {
    LazyColumn { items(items) { Text(it) } }
}

// ✅ Correct — complete state model + refresh/retry hooks.
sealed interface FeedUiState {
    data object Loading : FeedUiState
    data class Error(val message: String) : FeedUiState
    data object Empty : FeedUiState
    data class Success(val items: List<String>) : FeedUiState
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CorrectFeed(state: FeedUiState, isRefreshing: Boolean, onRetry: () -> Unit, onRefresh: () -> Unit) {
    PullToRefreshBox(isRefreshing = isRefreshing, onRefresh = onRefresh) {
        when (state) {
            FeedUiState.Loading -> CircularProgressIndicator()
            is FeedUiState.Error -> Column { Text(state.message); Button(onClick = onRetry) { Text("Retry") } }
            FeedUiState.Empty -> Text("No items yet")
            is FeedUiState.Success -> LazyColumn { items(state.items, key = { it }) { Text(it) } }
        }
    }
}
```
