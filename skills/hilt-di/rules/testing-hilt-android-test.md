# Testing with Hilt — @HiltAndroidTest, @UninstallModules, @BindValue

**Impact: CRITICAL**

Testing Hilt components without the proper test annotations causes real
dependencies to be used in tests, making them slow, flaky, and non-deterministic.

## Rule

### 1. @HiltAndroidTest — basic setup

```kotlin
// ✅ Instrumented test with Hilt
@HiltAndroidTest
class ScanRepositoryTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)   // ← order 0 — must run before other rules

    @get:Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var scanRepository: ScanRepository   // ← injected by Hilt in @Before

    @Before
    fun setUp() {
        hiltRule.inject()   // ← must call before using @Inject fields
    }

    @Test
    fun `scan solve returns valid response`() = runTest {
        val result = scanRepository.scanSolveQuestion(
            questionText = "What is 2 + 2?",
            imageBase64 = null,
            mimeType = "image/jpeg",
            mode = "math",
            isSuperAi = false
        )
        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrNull()?.finalAnswer).isNotBlank()
    }
}
```

### 2. @UninstallModules + @BindValue — replace real deps with fakes

```kotlin
// ✅ Replace real module with test fake
@UninstallModules(RepositoryModule::class)   // ← remove real module
@HiltAndroidTest
class ScanViewModelTest {

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeTestRule = createAndroidComposeRule<MainActivity>()

    // ✅ @BindValue provides fake in place of real @Binds
    @BindValue @JvmField
    val fakeScanRepository: ScanRepository = FakeScanRepository()

    @BindValue @JvmField
    val fakeUserRepository: UserRepository = FakeUserRepository()

    @Before fun setUp() { hiltRule.inject() }

    @Test
    fun `loading state shown while solving`() {
        composeTestRule.onNodeWithTag("scan_button").performClick()
        composeTestRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
    }
}
```

### 3. Fake implementations — implement interface, control behavior

```kotlin
// ✅ Fake — implements interface, controllable in tests
class FakeScanRepository : ScanRepository {

    var shouldFail = false
    var fakeResult = ScanSolveResponse(
        finalAnswer = "4",
        stepByStep = listOf("Add 2 + 2", "Result is 4"),
        concept = "Addition",
        topic = "Basic Arithmetic",
        subject = "Mathematics",
        difficulty = "easy",
        expectedTimeSeconds = 10,
        similarQuestions = listOf("q1", "q2", "q3")
    )

    override suspend fun scanSolveQuestion(
        questionText: String?, imageBase64: String?, mimeType: String,
        mode: String, isSuperAi: Boolean
    ): Result<ScanSolveResponse> {
        return if (shouldFail) Result.failure(Exception("Network error"))
        else Result.success(fakeResult)
    }

    override suspend fun checkQuota(userId: String) = QuotaStatus(remaining = 5, canScan = true)
}
```

### 4. Replace dispatchers in tests

```kotlin
// ✅ Replace dispatcher module for deterministic coroutine tests
@UninstallModules(DispatcherModule::class)
@HiltAndroidTest
class RepositoryTest {

    @BindValue @IoDispatcher @JvmField
    val testIoDispatcher: CoroutineDispatcher = UnconfinedTestDispatcher()

    @BindValue @DefaultDispatcher @JvmField
    val testDefaultDispatcher: CoroutineDispatcher = UnconfinedTestDispatcher()
}
```

### 5. Unit tests — no Hilt needed, inject directly

```kotlin
// ✅ Pure unit tests — create dependencies manually, no @HiltAndroidTest
class ScanViewModelTest {

    private val fakeScanRepo = FakeScanRepository()
    private lateinit var viewModel: ScanViewModel

    @Before
    fun setUp() {
        viewModel = ScanViewModel(
            scanRepository = fakeScanRepo,
        )
    }

    @Test
    fun `uiState shows loading when solving starts`() = runTest {
        viewModel.solveCapturedImage("base64", "image/jpeg", "math", false)
        assertThat(viewModel.uiState.value.isSolving).isTrue()
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Missing hiltRule.inject() in @Before — @Inject fields remain null
@Before
fun setUp() {
    // hiltRule.inject() missing → repository is null → NullPointerException
}

// ❌ Wrong rule order — hiltRule must be order 0
@get:Rule(order = 1) val hiltRule = HiltAndroidRule(this)     // ❌
@get:Rule(order = 0) val composeRule = createAndroidComposeRule<MainActivity>()
// ✅ hiltRule order = 0, composeRule order = 1

// ❌ Using @Mock (Mockito) instead of @BindValue — Hilt won't pick it up
@Mock val mockRepo: ScanRepository = mock()   // ❌ Hilt doesn't see @Mock
// ✅ Use @BindValue @JvmField

// ❌ Testing with real network/DB — slow, flaky, non-deterministic
// Always replace with Fakes via @UninstallModules + @BindValue
```
