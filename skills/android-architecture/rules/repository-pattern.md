# Repository Pattern — Interface, Implementation, Result Wrapping

**Impact: CRITICAL**

Repositories without interfaces are untestable. Repositories without Result
wrapping force callers to handle SDK-specific exceptions. Repositories that
don't run on IO dispatcher cause ANR crashes.

## Rule

### 1. Interface in domain layer — zero SDK imports

```kotlin
// domain/repository/ScanRepository.kt
// ✅ Pure Kotlin interface — no Supabase, no Room, no Android imports
interface ScanRepository {
    // suspend functions return Result<T> — callers never see SDK exceptions
    suspend fun scanSolveQuestion(
        questionText: String?,
        imageBase64: String?,
        mimeType: String,
        mode: String,
        isSuperAi: Boolean
    ): Result<ScanSolveResponse>

    suspend fun checkQuota(userId: String): Result<QuotaStatus>
    suspend fun getScanHistory(userId: String): Result<List<ScanHistory>>

    // Reactive — returns Flow for real-time updates
    fun observeScanHistory(userId: String): Flow<List<ScanHistory>>
}
```

### 2. Implementation in data layer — SDK details hidden here

```kotlin
// data/repository/ScanRepositoryImpl.kt
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {

    // ✅ runCatching wraps all SDK exceptions — ViewModel never sees FunctionsHttpException
    override suspend fun scanSolveQuestion(
        questionText: String?,
        imageBase64: String?,
        mimeType: String,
        mode: String,
        isSuperAi: Boolean
    ): Result<ScanSolveResponse> = withContext(ioDispatcher) {
        runCatching {
            supabase.functions.invoke(
                function = "scan-solve-question",
                body = buildJsonObject {
                    questionText?.let { put("question_text", it) }
                    imageBase64?.let { put("image_base64", it) }
                    put("image_mime_type", mimeType)
                    put("mode", mode)
                    put("super_ai", isSuperAi)
                }
            ).body<ScanSolveResponse>()
        }.mapCatching { response ->
            // Map SDK exceptions to domain exceptions
            response
        }.recoverCatching { exception ->
            throw when (exception) {
                is FunctionsHttpException -> when (exception.response.status.value) {
                    401 -> AuthException("Session expired")
                    429 -> QuotaExhaustedException("Daily scan limit reached")
                    else -> NetworkException("Server error: ${exception.message}")
                }
                is UnauthorizedRestException -> AuthException("Unauthorized")
                else -> NetworkException(exception.message ?: "Network error")
            }
        }
    }

    // ✅ Observable query — emits on changes
    override fun observeScanHistory(userId: String): Flow<List<ScanHistory>> = flow {
        emit(
            supabase.from("scan_history")
                .select { filter { eq("user_id", userId); order("created_at", Order.DESCENDING) } }
                .decodeList<ScanHistoryDto>()
                .map { it.toDomain() }
        )
    }.flowOn(ioDispatcher)
}
```

### 3. Hilt binding — always bind interface to implementation

```kotlin
// di/RepositoryModule.kt
@Module @InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository

    @Binds @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    @Binds @Singleton
    abstract fun bindQuestionRepository(impl: QuestionRepositoryImpl): QuestionRepository
}
```

### 4. ViewModel uses interface — never the implementation

```kotlin
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val repository: ScanRepository   // ← interface, not ScanRepositoryImpl
) : ViewModel() {

    fun solve(imageBase64: String, mimeType: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSolving = true) }
            repository.scanSolveQuestion(
                questionText = null,
                imageBase64 = imageBase64,
                mimeType = mimeType,
                mode = _uiState.value.selectedMode.value,
                isSuperAi = _uiState.value.isSuperAiEnabled
            ).onSuccess { result ->
                _uiState.update { it.copy(isSolving = false, result = result) }
            }.onFailure { error ->
                _uiState.update { it.copy(isSolving = false) }
                when (error) {
                    is QuotaExhaustedException -> _events.emit(ScanEvent.QuotaExhausted(0))
                    is AuthException           -> _events.emit(ScanEvent.SessionExpired)
                    else -> _events.emit(ScanEvent.ShowError(error.message ?: "Failed"))
                }
            }
        }
    }
}
```

## Anti-Patterns

```kotlin
// ❌ No interface — untestable, tightly coupled
class ScanViewModel @Inject constructor(
    private val repository: ScanRepositoryImpl   // ❌ concrete class
)

// ❌ No Result wrapping — ViewModel must handle SDK exceptions
override suspend fun scan(): ScanSolveResponse =
    supabase.functions.invoke(...).body()  // ❌ throws FunctionsHttpException
// ViewModel must now import and catch Supabase-specific exceptions

// ❌ Missing withContext(IO) — network on wrong thread
override suspend fun getHistory() =
    supabase.from("scan_history").select().decodeList<ScanHistory>()  // ❌ no dispatcher

// ❌ Business logic in Repository — wrong layer
override suspend fun scan(question: String): Result<ScanSolveResponse> {
    if (!isPremium && scanCount >= 5) return Result.failure(...)  // ❌ business rule in data layer
    // ✅ This belongs in a UseCase or ViewModel
}
```
