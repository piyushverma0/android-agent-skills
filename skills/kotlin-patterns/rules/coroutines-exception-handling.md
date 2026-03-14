# Coroutine Exception Handling

**Impact: CRITICAL**

Unhandled exceptions in `launch` silently crash the app or are swallowed.
`async` exceptions are deferred until `await()` — forgetting to catch them crashes later.

## Rule

### 1. runCatching — for expected failures in suspend functions

```kotlin
// ✅ runCatching wraps the call and returns Result<T> — no uncaught exception
fun loadQuestions() {
    viewModelScope.launch {
        runCatching { repository.getQuestions() }
            .onSuccess { questions ->
                _uiState.update { it.copy(questions = questions, isLoading = false) }
            }
            .onFailure { error ->
                _uiState.update { it.copy(isLoading = false, errorMessage = error.message) }
            }
    }
}
```

### 2. CoroutineExceptionHandler — for uncaught exceptions in launch

```kotlin
// ✅ Catches exceptions that escape the launch block
// Note: only works on root coroutines (launch at scope level), not on async
private val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
    Timber.e(throwable, "Unhandled coroutine exception")
    _uiState.update { it.copy(errorMessage = "Unexpected error occurred") }
}

fun syncData() {
    viewModelScope.launch(exceptionHandler) {
        repository.syncAll()
    }
}
```

### 3. try/catch in suspend functions

```kotlin
// ✅ try/catch inside suspend functions for granular handling
suspend fun uploadImage(bytes: ByteArray): Result<String> {
    return try {
        val path = storage.upload(bytes)
        Result.success(path)
    } catch (e: IOException) {
        Result.failure(NetworkException("Upload failed: no internet"))
    } catch (e: StorageException) {
        Result.failure(StorageException("Upload failed: ${e.message}"))
    }
}
```

### 4. async exception — always catch at await()

```kotlin
// ✅ Exceptions from async are thrown at await() — wrap in try/catch
val result = coroutineScope {
    val deferred = async { repository.getQuestions() }
    try {
        deferred.await()
    } catch (e: Exception) {
        emptyList()   // fallback
    }
}

// ✅ Or use supervisorScope so one async failure doesn't cancel siblings
val (questions, profile) = supervisorScope {
    val q = async { runCatching { repository.getQuestions() }.getOrDefault(emptyList()) }
    val p = async { runCatching { repository.getProfile() }.getOrNull() }
    q.await() to p.await()
}
```

### 5. Never swallow CancellationException

```kotlin
// ❌ Swallowing CancellationException prevents coroutine cancellation
try {
    delay(1000)
} catch (e: Exception) {
    // ❌ catches CancellationException — coroutine never cancels
    Timber.e(e)
}

// ✅ Always rethrow CancellationException
try {
    delay(1000)
} catch (e: CancellationException) {
    throw e   // ← rethrow — lets cancellation propagate
} catch (e: Exception) {
    Timber.e(e)   // handle other exceptions
}

// ✅ Or catch only what you expect
try {
    repository.load()
} catch (e: IOException) {
    handleNetworkError(e)
}
```

## Anti-Patterns

```kotlin
// ❌ Fire-and-forget with no error handling — silent failures
viewModelScope.launch {
    repository.syncData()   // ❌ if this throws, exception is lost
}

// ❌ CoroutineExceptionHandler on async — doesn't work, exception is deferred
val deferred = async(exceptionHandler) { riskyWork() }  // ❌ handler not called
deferred.await()   // exception thrown here instead

// ❌ runBlocking to bridge async to sync — blocks main thread
fun getSync() = runBlocking { repository.getData() }  // ❌ ANR risk
```
