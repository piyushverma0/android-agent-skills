# Error Handling — FunctionsHttpException, UnauthorizedRestException

**Impact: CRITICAL**

Unhandled Supabase exceptions crash the app. Each exception type maps to a
specific cause and fix. Treating all errors the same produces unusable error messages.

## Rule

### Exception type map

```kotlin
// ✅ Handle each exception type correctly
suspend fun callEdgeFunction(): ScanSolveResponse {
    return try {
        supabase.functions.invoke("scan-solve-question", body = payload)
            .body<ScanSolveResponse>()

    } catch (e: FunctionsHttpException) {
        // ← HTTP error returned BY your function (4xx, 5xx)
        // Read the error body your function sent
        val errorBody = runCatching { e.response.body<ErrorResponse>() }.getOrNull()
        when (e.response.status.value) {
            400  -> throw ValidationException(errorBody?.error ?: "Invalid request")
            401  -> throw AuthException("Session expired")
            413  -> throw ValidationException("Image too large (max 4MB)")
            429  -> throw QuotaException(
                message = errorBody?.error ?: "Quota exhausted",
                remainingScans = errorBody?.remainingScans ?: 0
            )
            500  -> throw ServerException("Server error — try again")
            else -> throw NetworkException("Request failed (${e.response.status.value})")
        }

    } catch (e: UnauthorizedRestException) {
        // ← JWT invalid or expired — the SDK rejected it before reaching the function
        throw AuthException("Session expired — please log in again")

    } catch (e: RestException) {
        // ← Postgrest/database error
        throw DatabaseException(e.message ?: "Database error")

    } catch (e: IOException) {
        // ← Network connectivity issue
        throw NetworkException("No internet connection")
    }
}

// ✅ Domain exception classes — map to user-facing messages in ViewModel
class AuthException(message: String) : Exception(message)
class QuotaException(message: String, val remainingScans: Int) : Exception(message)
class ValidationException(message: String) : Exception(message)
class NetworkException(message: String) : Exception(message)
class ServerException(message: String) : Exception(message)
class DatabaseException(message: String) : Exception(message)

@Serializable
data class ErrorResponse(
    val error: String,
    @SerialName("error_code")      val errorCode: String? = null,
    @SerialName("remaining_scans") val remainingScans: Int = 0
)
```

### ViewModel maps domain exceptions to events

```kotlin
.onFailure { error ->
    _uiState.update { it.copy(isSolving = false) }
    when (error) {
        is QuotaException  -> _events.emit(ScanEvent.QuotaExhausted(error.remainingScans))
        is AuthException   -> _events.emit(ScanEvent.SessionExpired)
        is NetworkException -> _uiState.update { it.copy(errorMessage = "No internet connection") }
        else               -> _uiState.update { it.copy(errorMessage = error.message) }
    }
}
```

### Error table

| Exception | Cause | Fix |
|---|---|---|
| `UnauthorizedRestException` | JWT invalid/expired OR edge function returning 401 | Check `persistSession: false` + `getUser(jwt)` in function |
| `FunctionsHttpException 401` | `verify_jwt = true` in config.toml | Add `config.toml` with `verify_jwt = false` |
| `FunctionsHttpException 429` | Quota exhausted by your function | Show upgrade UI |
| `FunctionsHttpException 400` | Bad input sent to function | Fix request body |
| `NoTransformationFoundException` | Response JSON doesn't match data class | Check field names and `@SerialName` |
| `RestException` | Supabase DB/RLS error | Check RLS policies and query syntax |

## Anti-Patterns

```kotlin
// ❌ Catch-all with no differentiation — wrong error messages
} catch (e: Exception) {
    _uiState.update { it.copy(errorMessage = "Something went wrong") }  // ❌ useless
}

// ❌ Showing raw exception message to user
} catch (e: FunctionsHttpException) {
    showError(e.message)  // ❌ exposes internal error details to user
}

// ❌ Ignoring quota errors — user gets no feedback
} catch (e: FunctionsHttpException) {
    if (e.response.status != HttpStatusCode.TooManyRequests) throw e
    // ❌ silently swallows quota error
}
```
