# Calling Edge Functions from Android

**Impact: CRITICAL**

Wrong invocation patterns cause serialization errors, missing auth, or
unhandled error responses that crash the app silently.

## Rule

### 1. Basic invocation — JWT attached automatically

```kotlin
// ✅ functions.invoke() automatically attaches the user's JWT
// No manual Authorization header needed — supabase-kt handles it
suspend fun solveScanQuestion(
    questionText: String?,
    imageBase64: String?,
    mimeType: String,
    mode: String,
    isSuperAi: Boolean
): ScanSolveResponse = withContext(Dispatchers.IO) {
    supabase.functions.invoke(
        function = "scan-solve-question",
        body = buildJsonObject {
            questionText?.let { put("question_text", it) }
            imageBase64?.let {
                put("image_base64", it)
                put("image_mime_type", mimeType)
            }
            put("mode", mode)
            put("super_ai", isSuperAi)
        }
    ).body<ScanSolveResponse>()
}
```

### 2. Response deserialization

```kotlin
// ✅ Define response data class — must match edge function JSON exactly
@Serializable
data class ScanSolveResponse(
    @SerialName("final_answer")          val finalAnswer: String,
    @SerialName("step_by_step")          val stepByStep: List<String>,
    val concept: String,
    val topic: String,
    val subject: String,
    val difficulty: String,
    @SerialName("expected_time_seconds") val expectedTimeSeconds: Int,
    @SerialName("similar_questions")     val similarQuestions: List<String>,
    @SerialName("extracted_question")    val extractedQuestion: String? = null,
    @SerialName("remaining_scans")       val remainingScans: Int = 0
)
```

### 3. Full error handling in Repository

```kotlin
override suspend fun scanSolveQuestion(...): Result<ScanSolveResponse> =
    withContext(ioDispatcher) {
        runCatching {
            supabase.functions.invoke(
                function = "scan-solve-question",
                body = buildJsonObject { /* ... */ }
            ).body<ScanSolveResponse>()
        }.mapFailure { error ->
            when (error) {
                is FunctionsHttpException -> {
                    val statusCode = error.response.status.value
                    when (statusCode) {
                        401 -> AuthException("Session expired — please log in again")
                        429 -> QuotaExhaustedException("Daily scan limit reached")
                        400 -> ValidationException("Invalid request: ${error.message}")
                        else -> NetworkException("Server error ($statusCode)")
                    }
                }
                is UnauthorizedRestException ->
                    AuthException("Unauthorized — please log in again")
                else -> NetworkException(error.message ?: "Unexpected error")
            }
        }
    }
```

### 4. ViewModel handles Result

```kotlin
fun solveCapturedImage(imageBase64: String, mimeType: String, mode: String, isSuperAi: Boolean) {
    if (_uiState.value.isSolving) return
    viewModelScope.launch {
        _uiState.update { it.copy(isSolving = true, errorMessage = null) }

        repository.scanSolveQuestion(
            questionText = null,
            imageBase64 = imageBase64,
            mimeType = mimeType,
            mode = mode,
            isSuperAi = isSuperAi
        ).onSuccess { result ->
            _uiState.update { it.copy(isSolving = false, result = result) }
        }.onFailure { error ->
            _uiState.update { it.copy(isSolving = false) }
            when (error) {
                is QuotaExhaustedException -> _events.emit(ScanEvent.QuotaExhausted)
                is AuthException           -> _events.emit(ScanEvent.SessionExpired)
                else -> _events.emit(ScanEvent.ShowError(error.message ?: "Failed"))
            }
        }
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Manual Authorization header — redundant, supabase-kt does this automatically
supabase.functions.invoke(
    function = "my-function",
    headers = mapOf("Authorization" to "Bearer ${supabase.auth.currentSession?.accessToken}")
)

// ❌ No error handling — crashes on network failure or quota exhaustion
val result = supabase.functions.invoke("scan-solve-question", body = payload).body<Response>()
// ✅ Wrap in runCatching or try/catch

// ❌ Calling invoke() directly in ViewModel — wrong layer
class WrongViewModel : ViewModel() {
    fun solve() = viewModelScope.launch {
        supabase.functions.invoke(...)  // ❌ network in ViewModel, not in Repository
    }
}
```
