# Testing Architecture — Unit, Integration, UI Tests

**Impact: HIGH**

Tests that require a device (instrumented) for things that can be tested
on JVM (unit tests) are slow and fragile. The testing pyramid must be inverted.

## Rule

### Testing pyramid

```
        ▲  UI Tests (10%)     — Compose test rules, Hilt integration
       ▲▲▲ Integration Tests (20%) — Repository with in-memory DB / fake network
     ▲▲▲▲▲ Unit Tests (70%)    — ViewModel, UseCase, Mapper — fast, no Android
```

### 1. ViewModel unit tests — no Android, no Hilt needed

```kotlin
// ✅ Pure JVM unit test — fast, no instrumentation
class ScanViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()   // ← sets Dispatchers.Main for tests

    private val fakeScanRepo = FakeScanRepository()
    private lateinit var viewModel: ScanViewModel

    @Before
    fun setUp() {
        viewModel = ScanViewModel(scanRepository = fakeScanRepo)
    }

    @Test
    fun `uiState shows loading when solving starts`() = runTest {
        fakeScanRepo.delay = 1000   // slow response
        viewModel.solveCapturedImage("base64", "image/jpeg", "math", false)

        assertThat(viewModel.uiState.value.isSolving).isTrue()
    }

    @Test
    fun `uiState shows result on success`() = runTest {
        viewModel.solveCapturedImage("base64", "image/jpeg", "math", false)
        advanceUntilIdle()

        assertThat(viewModel.uiState.value.result).isNotNull()
        assertThat(viewModel.uiState.value.isSolving).isFalse()
    }

    @Test
    fun `emits QuotaExhausted event on quota error`() = runTest {
        fakeScanRepo.error = QuotaExhaustedException("Quota exhausted")

        val events = mutableListOf<ScanEvent>()
        backgroundScope.launch { viewModel.events.toList(events) }

        viewModel.solveCapturedImage("base64", "image/jpeg", "math", false)
        advanceUntilIdle()

        assertThat(events).contains(ScanEvent.QuotaExhausted(0))
    }
}

// MainDispatcherRule — replaces Dispatchers.Main with test dispatcher
class MainDispatcherRule(
    val testDispatcher: TestCoroutineDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(testDispatcher)
    }
    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
```

### 2. Fake implementations — prefer over mocks

```kotlin
// ✅ Fake — controllable, readable, no mock framework needed
class FakeScanRepository : ScanRepository {
    var error: Exception? = null
    var delay: Long = 0
    var result: ScanSolveResponse = defaultResult

    override suspend fun scanSolveQuestion(...): Result<ScanSolveResponse> {
        if (delay > 0) kotlinx.coroutines.delay(delay)
        return error?.let { Result.failure(it) } ?: Result.success(result)
    }

    override suspend fun checkQuota(userId: String) =
        Result.success(QuotaStatus(remaining = 5, canScan = true))
}
```

### 3. UseCase unit tests — pure Kotlin, inject fakes

```kotlin
class CheckAndConsumeScanQuotaUseCaseTest {

    private val fakeUserRepo = FakeUserRepository()
    private val fakeScanRepo = FakeScanRepository()
    private val useCase = CheckAndConsumeScanQuotaUseCase(fakeUserRepo, fakeScanRepo)

    @Test
    fun `premium user gets unlimited scans`() = runTest {
        fakeUserRepo.isPremium = true
        val result = useCase("user123")
        assertThat(result.getOrNull()).isEqualTo(QuotaConsumeResult.Unlimited)
    }

    @Test
    fun `non-premium user quota is consumed`() = runTest {
        fakeUserRepo.isPremium = false
        fakeScanRepo.quota = QuotaStatus(remaining = 4, canScan = true)
        val result = useCase("user123")
        assertThat(result.getOrNull()?.remaining).isEqualTo(4)
    }
}
```

### 4. Repository integration tests — in-memory DB

```kotlin
// ✅ Repository tests with real Room in-memory DB (no network)
@RunWith(AndroidJUnit4::class)
class QuestionRepositoryTest {

    private lateinit var database: AppDatabase
    private lateinit var repository: QuestionRepositoryImpl

    @Before
    fun setUp() {
        database = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries().build()

        repository = QuestionRepositoryImpl(
            questionDao = database.questionDao(),
            ioDispatcher = UnconfinedTestDispatcher()
        )
    }

    @After fun tearDown() { database.close() }

    @Test
    fun `insert and retrieve questions`() = runTest {
        repository.saveQuestion(testQuestion)
        val result = repository.getQuestions("user123")
        assertThat(result.getOrNull()).containsExactly(testQuestion)
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Testing ViewModel with real Repository — slow, flaky, network-dependent
class WrongTest {
    private val viewModel = ScanViewModel(
        scanRepository = ScanRepositoryImpl(supabase = realSupabaseClient)  // ❌ real network
    )
}

// ❌ Mocking data classes — unnecessary, just use the constructor
val mockQuestion = mock<Question>()     // ❌
val testQuestion  = Question(id = "1", text = "test question", ...)  // ✅

// ❌ Instrumented test for logic that doesn't need Android
@RunWith(AndroidJUnit4::class)   // ❌ not needed for ViewModel unit tests
class WrongViewModelTest

// ❌ No MainDispatcherRule — Dispatchers.Main not initialized → crash
class WrongTest {
    val viewModel = ScanViewModel(...)
    // runTest with coroutines that use Dispatchers.Main → IllegalStateException
}
```
