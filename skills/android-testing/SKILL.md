---
name: android-testing
description: |
  Android testing for AI agents. Use this skill whenever writing unit tests, integration tests,
  UI tests, ViewModel tests, Repository tests, DAO tests, Compose UI tests, Hilt testing,
  @HiltAndroidTest, TestCoroutineDispatcher, runTest, turbine Flow testing, MockK, Mockito,
  FakeRepository, Robolectric, Espresso, Compose testing semantics, screenshot tests,
  Roborazzi, JUnit 4/5, test doubles, test dispatchers, MainCoroutineRule, or any testing
  in Android. Always apply before writing any test class. Production apps require tests.
---

# Android Testing

No tests = not production-ready. These rules cover the complete Android testing stack.

## Setup — all testing dependencies

```toml
[versions]
junit = "4.13.2"
junitExt = "1.2.1"
coroutinesTest = "1.9.0"
mockk = "1.13.12"
turbine = "1.1.0"
roborazzi = "1.27.0"
hiltTesting = "2.52"

[libraries]
junit = { group = "junit", name = "junit", version.ref = "junit" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }
mockk-android = { group = "io.mockk", name = "mockk-android", version.ref = "mockk" }
kotlinx-coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "coroutinesTest" }
turbine = { group = "app.cash.turbine", name = "turbine", version.ref = "turbine" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitExt" }
hilt-android-testing = { group = "com.google.dagger", name = "hilt-android-testing", version.ref = "hiltTesting" }
room-testing = { group = "androidx.room", name = "room-testing", version.ref = "room" }
roborazzi = { group = "io.github.takahirom.roborazzi", name = "roborazzi", version.ref = "roborazzi" }
roborazzi-compose = { group = "io.github.takahirom.roborazzi", name = "roborazzi-compose", version.ref = "roborazzi" }
```

```kotlin
// build.gradle.kts
testImplementation(libs.junit)
testImplementation(libs.mockk)
testImplementation(libs.kotlinx.coroutines.test)
testImplementation(libs.turbine)
testImplementation(libs.room.testing)
androidTestImplementation(libs.androidx.junit)
androidTestImplementation(libs.hilt.android.testing)
androidTestImplementation(libs.mockk.android)
androidTestImplementation(libs.roborazzi)
androidTestImplementation(libs.roborazzi.compose)
kspAndroidTest(libs.hilt.compiler)
```

## Rule 1: ViewModel tests — pure unit tests

```kotlin
class HomeViewModelTest {
    // Replace Main dispatcher with test dispatcher
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val fakeRepository = FakeItemRepository()
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setUp() {
        viewModel = HomeViewModel(
            getItems = GetItemsUseCase(fakeRepository),
            toggleFavorite = ToggleFavoriteUseCase(fakeRepository)
        )
    }

    @Test
    fun `initial state is Loading`() = runTest {
        viewModel.uiState.test {
            assertEquals(HomeUiState.Loading, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `loads items successfully`() = runTest {
        fakeRepository.setItems(listOf(sampleItem))

        viewModel.uiState.test {
            skipItems(1) // skip Loading
            val state = awaitItem()
            assertTrue(state is HomeUiState.Success)
            assertEquals(1, (state as HomeUiState.Success).items.size)
        }
    }

    @Test
    fun `shows error when loading fails`() = runTest {
        fakeRepository.setShouldFail(true)

        viewModel.uiState.test {
            skipItems(1) // skip Loading
            assertTrue(awaitItem() is HomeUiState.Error)
        }
    }

    @Test
    fun `emits navigation event on item click`() = runTest {
        viewModel.events.test {
            viewModel.onItemClick("item-123")
            assertEquals(HomeEvent.NavigateToDetail("item-123"), awaitItem())
        }
    }
}

// MainDispatcherRule — required for every ViewModel test
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }
    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
```

## Rule 2: Fake repositories — test doubles over mocks for repositories

```kotlin
// ✅ Fake repository — controllable, reliable
class FakeItemRepository : ItemRepository {
    private val items = MutableStateFlow<List<Item>>(emptyList())
    private var shouldFail = false
    private var syncDelay = 0L

    fun setItems(newItems: List<Item>) { items.value = newItems }
    fun setShouldFail(fail: Boolean) { shouldFail = fail }

    override fun getItemsStream(): Flow<List<Item>> = items

    override suspend fun getItems(): Result<List<Item>> {
        if (syncDelay > 0) delay(syncDelay)
        return if (shouldFail) Result.failure(IOException("Network error"))
        else Result.success(items.value)
    }

    override suspend fun toggleFavorite(id: String): Result<Unit> {
        if (shouldFail) return Result.failure(IOException("Network error"))
        items.update { current ->
            current.map { if (it.id == id) it.copy(isFavorite = !it.isFavorite) else it }
        }
        return Result.success(Unit)
    }
}
```

## Rule 3: Repository tests with in-memory Room

```kotlin
@RunWith(AndroidJUnit4::class)
class ItemRepositoryTest {
    private lateinit var db: AppDatabase
    private lateinit var dao: ItemDao
    private lateinit var mockApi: ItemApiService
    private lateinit var repository: ItemRepositoryImpl

    @Before
    fun setUp() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries().build()

        dao = db.itemDao()
        mockApi = mockk()
        repository = ItemRepositoryImpl(mockApi, dao, UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() { db.close() }

    @Test
    fun `sync saves items to local database`() = runTest {
        val remoteItems = listOf(ItemDto("1", "Test Item", "Description"))
        coEvery { mockApi.getItems() } returns remoteItems

        repository.sync()

        repository.getItemsStream().test {
            val items = awaitItem()
            assertEquals(1, items.size)
            assertEquals("Test Item", items.first().title)
        }
    }

    @Test
    fun `returns cached data when network fails`() = runTest {
        dao.upsertAll(listOf(ItemEntity("1", "Cached Item", "Description")))
        coEvery { mockApi.getItems() } throws IOException("Network error")

        val result = repository.getItems()
        assertTrue(result.isSuccess)
        assertEquals("Cached Item", result.getOrNull()?.first()?.title)
    }
}
```

## Rule 4: Compose UI tests

```kotlin
@RunWith(AndroidJUnit4::class)
class HomeScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun `shows loading indicator initially`() {
        composeTestRule.setContent {
            MyAppTheme {
                HomeContent(uiState = HomeUiState.Loading, onItemClick = {}, onRetry = {})
            }
        }
        composeTestRule.onNodeWithContentDescription("Loading").assertIsDisplayed()
    }

    @Test
    fun `shows items when loaded`() {
        val items = listOf(Item("1", "Test Item", "Description"))
        composeTestRule.setContent {
            MyAppTheme {
                HomeContent(
                    uiState = HomeUiState.Success(items),
                    onItemClick = {},
                    onRetry = {}
                )
            }
        }
        composeTestRule.onNodeWithText("Test Item").assertIsDisplayed()
    }

    @Test
    fun `retry button calls onRetry`() {
        var retryClicked = false
        composeTestRule.setContent {
            MyAppTheme {
                HomeContent(
                    uiState = HomeUiState.Error("Network error"),
                    onItemClick = {},
                    onRetry = { retryClicked = true }
                )
            }
        }
        composeTestRule.onNodeWithText("Try again").performClick()
        assertTrue(retryClicked)
    }

    @Test
    fun `clicking item triggers navigation`() {
        var clickedId = ""
        val items = listOf(Item("item-1", "Test Item", "Description"))
        composeTestRule.setContent {
            MyAppTheme {
                HomeContent(
                    uiState = HomeUiState.Success(items),
                    onItemClick = { clickedId = it },
                    onRetry = {}
                )
            }
        }
        composeTestRule.onNodeWithText("Test Item").performClick()
        assertEquals("item-1", clickedId)
    }
}
```

## Rule 5: Screenshot tests with Roborazzi

```kotlin
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34], qualifiers = RobolectricDeviceQualifiers.Pixel6)
class HomeScreenScreenshotTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun homeScreen_loading() {
        composeTestRule.setContent {
            MyAppTheme { HomeContent(HomeUiState.Loading, {}, {}) }
        }
        composeTestRule.onRoot().captureRoboImage()
    }

    @Test
    fun homeScreen_success() {
        composeTestRule.setContent {
            MyAppTheme { HomeContent(HomeUiState.Success(sampleItems), {}, {}) }
        }
        composeTestRule.onRoot().captureRoboImage()
    }

    @Test
    fun homeScreen_dark() {
        composeTestRule.setContent {
            MyAppTheme(darkTheme = true) { HomeContent(HomeUiState.Success(sampleItems), {}, {}) }
        }
        composeTestRule.onRoot().captureRoboImage()
    }
}
```

## Rule 6: Hilt integration tests

```kotlin
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class HomeViewModelIntegrationTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val mainDispatcherRule = MainDispatcherRule()

    @BindValue
    val fakeRepository: ItemRepository = FakeItemRepository()

    @Inject
    lateinit var getItems: GetItemsUseCase

    @Before
    fun setUp() { hiltRule.inject() }

    @Test
    fun `full integration: ViewModel loads items via UseCase`() = runTest {
        (fakeRepository as FakeItemRepository).setItems(listOf(sampleItem))
        val viewModel = HomeViewModel(getItems)

        viewModel.uiState.test {
            skipItems(1) // Loading
            assertTrue(awaitItem() is HomeUiState.Success)
        }
    }
}
```

## Common Mistakes

❌ Testing without `MainDispatcherRule` — coroutine tests hang or produce wrong results
❌ Mocking Repository in ViewModel tests — use Fake instead for reliability
❌ Missing `@After` to close in-memory DB — causes test pollution
❌ `runBlocking` in tests — use `runTest` from coroutines-test
❌ Testing ViewModel with real network calls — always fake/mock external dependencies
❌ Missing `allowMainThreadQueries()` for Room in tests — crash on test thread

## Deep-dive references

- `references/testing-strategies.md` — testing pyramid, what to unit vs integration test
- `references/mockk-patterns.md` — MockK for complex scenarios
