# Sealed Classes and Result Wrapping

**Impact: HIGH**

Nullable returns and boolean flags for operation results are ambiguous.
Sealed classes make every state explicit and exhaustive — the compiler enforces handling.

## Rule

### 1. Sealed interface for operation states

```kotlin
// ✅ Every distinct state is a type — compiler forces exhaustive when expression
sealed interface UiState {
    object Loading : UiState
    data class Success(val data: List<Question>) : UiState
    data class Error(val message: String, val isRetryable: Boolean = true) : UiState
    object Empty : UiState
}

// ✅ Compose — exhaustive when, no else branch needed
when (val state = uiState) {
    UiState.Loading        -> LoadingIndicator()
    is UiState.Success     -> QuestionList(state.data)
    is UiState.Error       -> ErrorView(state.message, state.isRetryable)
    UiState.Empty          -> EmptyView()
}
```

### 2. Sealed interface for events

```kotlin
// ✅ One-shot events — each carries exactly the data it needs
sealed interface ScanEvent {
    data class ShowError(val message: String)          : ScanEvent
    data class Navigate(val route: String)             : ScanEvent
    data class QuotaExhausted(val remaining: Int)      : ScanEvent
    object SessionExpired                              : ScanEvent
}
```

### 3. Result<T> for Repository return types

```kotlin
// ✅ Repository returns Result<T> — ViewModel decides how to handle failure
interface ScanRepository {
    suspend fun scanSolve(question: String): Result<ScanSolveResponse>
}

// ✅ Implementation uses runCatching
override suspend fun scanSolve(question: String): Result<ScanSolveResponse> =
    runCatching {
        supabase.functions.invoke("scan-solve-question",
            body = buildJsonObject { put("question_text", question) }
        ).body<ScanSolveResponse>()
    }

// ✅ ViewModel handles Result
fun solve(question: String) {
    viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true) }
        repository.scanSolve(question)
            .onSuccess { result ->
                _uiState.update { it.copy(isLoading = false, result = result) }
            }
            .onFailure { error ->
                _uiState.update { it.copy(isLoading = false) }
                _events.emit(ScanEvent.ShowError(error.message ?: "Failed"))
            }
    }
}
```

### 4. sealed class vs sealed interface

```kotlin
// ✅ sealed interface — preferred (allows multiple inheritance)
sealed interface NetworkResult<out T> {
    data class Success<T>(val data: T) : NetworkResult<T>
    data class Error(val code: Int, val message: String) : NetworkResult<Nothing>
    object Loading : NetworkResult<Nothing>
}

// sealed class — use when you need a common constructor
sealed class Screen(val route: String) {
    object Home   : Screen("home")
    object Scan   : Screen("scan")
    data class Detail(val id: String) : Screen("detail/$id")
}
```

## Anti-Patterns

```kotlin
// ❌ Nullable for operation result — ambiguous (null = error? or null = empty?)
suspend fun getQuestions(): List<Question>? = ...   // ❌ what does null mean?
// ✅
suspend fun getQuestions(): Result<List<Question>>

// ❌ Boolean for operation result — no error information
suspend fun deleteQuestion(id: String): Boolean     // ❌ why did it fail?
// ✅
suspend fun deleteQuestion(id: String): Result<Unit>

// ❌ else branch in when on sealed — defeats exhaustiveness checking
when (uiState) {
    is UiState.Success -> showContent()
    else -> showError()   // ❌ silently ignores Loading and Empty states
}

// ❌ Abstract class for simple state — sealed interface is cleaner
abstract class UiState   // ❌ can be extended anywhere
sealed interface UiState // ✅ all subclasses in same file
```
