# Repository Pattern for Supabase

**Impact: HIGH**

Calling Supabase directly from ViewModels couples business logic to the SDK,
makes testing impossible, and puts network code on the wrong thread.
All Supabase calls go through a Repository.

## Rule

### 1. Interface in domain layer — no SDK imports

```kotlin
// domain/repository/ScanRepository.kt
// ✅ Interface has no Supabase imports — pure Kotlin domain types
interface ScanRepository {
    suspend fun scanSolveQuestion(
        questionText: String?,
        imageBase64: String?,
        mimeType: String,
        mode: String,
        isSuperAi: Boolean
    ): ScanSolveResponse

    suspend fun checkQuota(userId: String): QuotaStatus
    suspend fun getScanHistory(userId: String): List<ScanHistory>
    fun observeScanHistory(userId: String): Flow<List<ScanHistory>>
}
```

### 2. Implementation in data layer

```kotlin
// data/repository/ScanRepositoryImpl.kt
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {

    override suspend fun scanSolveQuestion(
        questionText: String?,
        imageBase64: String?,
        mimeType: String,
        mode: String,
        isSuperAi: Boolean
    ): ScanSolveResponse = withContext(ioDispatcher) {
        supabase.functions.invoke(
            function = "scan-solve-question",
            body = buildJsonObject {
                questionText?.let { put("question_text", it) }
                imageBase64?.let { put("image_base64", it); put("image_mime_type", mimeType) }
                put("mode", mode)
                put("super_ai", isSuperAi)
            }
        ).body<ScanSolveResponse>()
    }

    override fun observeScanHistory(userId: String): Flow<List<ScanHistory>> = flow {
        // Emit initial data
        val initial = supabase.from("scan_history")
            .select { filter { eq("user_id", userId) } }
            .decodeList<ScanHistory>()
        emit(initial)

        // Then stream realtime updates
        val channel = supabase.channel("scan-history-$userId")
        channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
            table  = "scan_history"
            filter = "user_id=eq.$userId"
        }.collect { change ->
            val updated = supabase.from("scan_history")
                .select { filter { eq("user_id", userId) } }
                .decodeList<ScanHistory>()
            emit(updated)
        }
        channel.subscribe()
    }.flowOn(ioDispatcher)
}
```

### 3. Hilt binding

```kotlin
// di/RepositoryModule.kt
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository
}
```

### 4. ViewModel uses interface — never the implementation

```kotlin
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val repository: ScanRepository,   // ← interface, not ScanRepositoryImpl
) : ViewModel() {

    fun solve(imageBase64: String, mimeType: String) {
        viewModelScope.launch {
            runCatching {
                repository.scanSolveQuestion(
                    questionText = null,
                    imageBase64 = imageBase64,
                    mimeType = mimeType,
                    mode = "general",
                    isSuperAi = false
                )
            }.onSuccess { result ->
                _uiState.update { it.copy(result = result) }
            }.onFailure { error ->
                _uiState.update { it.copy(errorMessage = error.message) }
            }
        }
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Supabase called directly in ViewModel
@HiltViewModel
class WrongViewModel : ViewModel() {
    @Inject lateinit var supabase: SupabaseClient   // ❌ SDK in ViewModel

    fun solve() = viewModelScope.launch {
        supabase.functions.invoke(...)  // ❌ no separation of concerns, untestable
    }
}

// ❌ Missing withContext(ioDispatcher) — Supabase calls on wrong thread
override suspend fun getHistory(): List<ScanHistory> =
    supabase.from("scan_history").select().decodeList()  // ❌ missing withContext
```
