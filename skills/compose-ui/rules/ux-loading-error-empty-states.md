# Loading, Error, and Empty State Patterns

**Impact: CRITICAL**

Every screen has three states beyond "success": loading, error, and empty.
Agents skip these because they're not in the happy path. Missing them = broken UX for all users.

## Rule

### 1. Model all states in UiState (sealed interface or data class)

```kotlin
// ✅ Pattern A — sealed interface for distinct states (loading/success/error are mutually exclusive)
sealed interface ScanUiState {
    object Loading : ScanUiState
    data class Success(val result: ScanSolveResponse) : ScanUiState
    data class Error(val message: String, val isRetryable: Boolean = true) : ScanUiState
    object Empty : ScanUiState
}

// ✅ Pattern B — data class with nullable result (multiple concurrent states)
data class QuestionListUiState(
    val isLoading: Boolean = false,
    val questions: List<Question> = emptyList(),
    val errorMessage: String? = null,
    val isRefreshing: Boolean = false   // pull-to-refresh state
)
```

### 2. Render every state — never skip loading or error

```kotlin
@Composable
fun ScanResultScreen(uiState: ScanUiState) {
    when (uiState) {
        is ScanUiState.Loading -> LoadingState()
        is ScanUiState.Success -> SuccessContent(uiState.result)
        is ScanUiState.Error   -> ErrorState(
            message = uiState.message,
            onRetry = if (uiState.isRetryable) onRetry else null
        )
        is ScanUiState.Empty   -> EmptyState()
    }
}

// ✅ Loading state — use M3 components, not custom spinners
@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()  // ← Material 3 — matches system style
    }
}

// ✅ Error state — always offer a retry action
@Composable
fun ErrorState(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.ErrorOutline,
            contentDescription = null,
            modifier = Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        onRetry?.let {
            Spacer(Modifier.height(24.dp))
            Button(onClick = it) { Text("Try again") }
        }
    }
}

// ✅ Empty state — explain WHY it's empty and what to do
@Composable
fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.SearchOff, contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(16.dp))
        Text("No questions yet", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            "Scan your first exam question to get started",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}
```

### 3. Skeleton loading — better perceived performance than spinner

```kotlin
// ✅ Shimmer/skeleton placeholder using animatable alpha
@Composable
fun QuestionCardSkeleton(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "skeleton")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "skeleton_alpha"
    )
    Card(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.7f)
                    .height(20.dp)
                    .alpha(alpha)
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f),
                        RoundedCornerShape(4.dp))
            )
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(14.dp)
                    .alpha(alpha)
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f),
                        RoundedCornerShape(4.dp))
            )
        }
    }
}
```

### 4. Pull-to-refresh

```kotlin
// ✅ PullToRefreshBox — Material 3 (API available in Compose 1.3+)
@Composable
fun QuestionListScreen(
    uiState: QuestionListUiState,
    onRefresh: () -> Unit
) {
    PullToRefreshBox(
        isRefreshing = uiState.isRefreshing,
        onRefresh = onRefresh
    ) {
        LazyColumn {
            items(uiState.questions, key = { it.id }) { QuestionCard(it) }
        }
    }
}
```

### 5. Inline loading in existing content (partial refresh)

```kotlin
// ✅ Show spinner overlay on existing content during background refresh
Box(modifier = Modifier.fillMaxSize()) {
    // Existing content stays visible
    QuestionList(questions = uiState.questions)

    // Subtle overlay spinner during refresh — doesn't block the whole screen
    if (uiState.isRefreshing) {
        LinearProgressIndicator(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter)
        )
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Loading state ignored — screen shows nothing during load
@Composable
fun Screen(uiState: UiState) {
    if (uiState.data != null) {
        ContentView(uiState.data)
    }
    // ❌ no loading or error state — blank screen during fetch, broken on error
}

// ❌ Generic "Something went wrong" with no retry — dead end for users
ErrorText("Something went wrong")   // ❌ no action offered

// ❌ Empty list with no explanation
LazyColumn { items(emptyList<Item>()) { } }  // ❌ shows nothing, user confused
```
