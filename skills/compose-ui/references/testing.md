# Compose UI Testing Reference

Full testing API for Jetpack Compose. Read when writing any Compose UI test.

---

## Setup

```kotlin
// build.gradle.kts (app)
androidTestImplementation(platform("androidx.compose:compose-bom:2024.09.00"))
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
androidTestImplementation("androidx.navigation:navigation-testing:2.8.1")
debugImplementation("androidx.compose.ui:ui-test-manifest")

// Unit test (non-instrumented)
testImplementation("junit:junit:4.13.2")
testImplementation("io.mockk:mockk:1.13.12")
testImplementation("app.cash.turbine:turbine:1.1.0")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
```

---

## 1. ComposeTestRule — Two Variants

```kotlin
// createComposeRule() — no Activity needed, fast, for isolated composable tests
class QuestionCardTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun `shows question text`() {
        composeTestRule.setContent {
            AppTheme {
                QuestionCard(
                    question = Question(id = "1", text = "What is 2+2?", difficulty = "easy"),
                    onClick = {}
                )
            }
        }
        composeTestRule.onNodeWithText("What is 2+2?").assertIsDisplayed()
    }
}

// createAndroidComposeRule<MainActivity>() — needs real Activity, for integration/nav tests
@HiltAndroidTest
class ScanScreenTest {
    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Before fun setUp() { hiltRule.inject() }
}
```

---

## 2. Adding testTags — Always Do This for Testable UI

```kotlin
// In your composable
@Composable
fun ScanButton(onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.testTag("scan_button")   // ← add semantic tag
    ) {
        Text("Scan")
    }
}

// Loading indicator
CircularProgressIndicator(modifier = Modifier.testTag("loading_indicator"))

// Error message
Text(text = errorMessage, modifier = Modifier.testTag("error_message"))
```

---

## 3. Finding Nodes

```kotlin
// By text (exact match by default)
composeTestRule.onNodeWithText("Scan Question")
composeTestRule.onNodeWithText("Scan", substring = true)    // partial match
composeTestRule.onNodeWithText("scan", ignoreCase = true)   // case-insensitive

// By test tag (most reliable — not affected by text changes)
composeTestRule.onNodeWithTag("scan_button")
composeTestRule.onNodeWithTag("scan_button", useUnmergedTree = true)  // for nested semantics

// By content description (for icons/images)
composeTestRule.onNodeWithContentDescription("Back")
composeTestRule.onNodeWithContentDescription("Close", substring = true)

// By role / semantics
composeTestRule.onNode(hasClickAction())
composeTestRule.onNode(hasSetTextAction())
composeTestRule.onNode(isDialog())
composeTestRule.onNode(isPopup())

// Combining matchers
composeTestRule.onNode(
    hasText("Submit") and hasClickAction() and isEnabled()
)

// Finding multiple nodes
composeTestRule.onAllNodesWithText("Delete")               // returns list
composeTestRule.onAllNodesWithTag("question_card")[0]       // first match
```

---

## 4. Actions

```kotlin
val node = composeTestRule.onNodeWithTag("scan_button")

node.performClick()
node.performLongClick()
node.performDoubleClick()

// Text input
composeTestRule.onNodeWithTag("search_field").performTextInput("probability")
composeTestRule.onNodeWithTag("search_field").performTextClearance()
composeTestRule.onNodeWithTag("search_field").performTextReplacement("new text")
composeTestRule.onNodeWithTag("search_field").performImeAction()    // keyboard "Done"/"Search"

// Scroll
composeTestRule.onNodeWithTag("question_list").performScrollToIndex(10)
composeTestRule.onNodeWithTag("question_list").performScrollToNode(hasText("Last Item"))
composeTestRule.onNodeWithTag("scrollable").performTouchInput { swipeUp() }
composeTestRule.onNodeWithTag("scrollable").performTouchInput { swipeDown() }

// Gesture
composeTestRule.onNodeWithTag("image").performTouchInput {
    pinch(start0 = center, start1 = centerRight, end0 = topLeft, end1 = bottomRight)
}
```

---

## 5. Assertions

```kotlin
val node = composeTestRule.onNodeWithTag("scan_button")

node.assertIsDisplayed()
node.assertIsNotDisplayed()
node.assertExists()
node.assertDoesNotExist()
node.assertIsEnabled()
node.assertIsNotEnabled()
node.assertIsSelected()
node.assertIsNotSelected()
node.assertIsToggleable()
node.assertIsFocused()
node.assertIsNotFocused()
node.assertHasClickAction()
node.assertHasNoClickAction()

node.assertTextEquals("Scan")
node.assertTextContains("Scan", substring = true)
node.assertContentDescriptionEquals("Scan button")
node.assertCountEquals(3)    // on onAllNodes result

// Value assertions
composeTestRule.onNodeWithTag("progress").assertRangeInfoEquals(ProgressBarRangeInfo(0.5f, 0f..1f))
```

---

## 6. Testing State Changes

```kotlin
@Test
fun `shows loading indicator while solving`() {
    // Arrange — create fake ViewModel state
    var uiState by mutableStateOf(ScanUiState())

    composeTestRule.setContent {
        AppTheme {
            ScanScreenContent(
                uiState = uiState,
                onCapture = {}
            )
        }
    }

    // Assert initial state
    composeTestRule.onNodeWithTag("loading_indicator").assertDoesNotExist()

    // Act — update state
    uiState = uiState.copy(isSolving = true)

    // Assert new state — Compose recomposes automatically
    composeTestRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
}
```

---

## 7. Testing with ViewModel (Hilt)

```kotlin
@HiltAndroidTest
@UninstallModules(RepositoryModule::class)
class ScanScreenIntegrationTest {

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeTestRule = createAndroidComposeRule<MainActivity>()

    @BindValue @JvmField
    val fakeScanRepo: ScanRepository = FakeScanRepository()

    @Before fun setUp() { hiltRule.inject() }

    @Test
    fun `tapping scan button shows loading then result`() {
        // Navigate to scan screen
        composeTestRule.onNodeWithTag("scan_nav_button").performClick()

        // Simulate capture
        composeTestRule.onNodeWithTag("shutter_button").performClick()

        // Loading appears
        composeTestRule.onNodeWithTag("solving_indicator").assertIsDisplayed()

        // Wait for result
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            composeTestRule.onAllNodesWithTag("result_sheet").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithTag("result_sheet").assertIsDisplayed()
    }
}
```

---

## 8. waitUntil — For Async Operations

```kotlin
// ✅ Wait for a condition with timeout (default 1000ms)
composeTestRule.waitUntil(timeoutMillis = 3_000) {
    composeTestRule
        .onAllNodesWithTag("result_card")
        .fetchSemanticsNodes()
        .isNotEmpty()
}

// ✅ Wait for node to disappear
composeTestRule.waitUntil(timeoutMillis = 5_000) {
    composeTestRule
        .onAllNodesWithTag("loading_indicator")
        .fetchSemanticsNodes()
        .isEmpty()
}
```

---

## 9. Testing Navigation

```kotlin
@Test
fun `clicking question navigates to detail screen`() {
    val navController = TestNavHostController(ApplicationProvider.getApplicationContext())

    composeTestRule.setContent {
        AppTheme {
            AppNavHost(navController = navController)
        }
    }

    // Click first question
    composeTestRule.onAllNodesWithTag("question_card")[0].performClick()

    // Verify navigation
    assertThat(navController.currentDestination?.route)
        .isEqualTo(Screen.ScanResult.route)
}
```

---

## 10. Screenshot Testing with Paparazzi

```kotlin
// build.gradle.kts
testImplementation("app.cash.paparazzi:paparazzi:1.3.4")

// Test
class QuestionCardScreenshotTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_6,
        theme = "android:Theme.Material3.Light.NoActionBar"
    )

    @Test
    fun `question card light theme`() {
        paparazzi.snapshot {
            AppTheme(darkTheme = false) {
                QuestionCard(
                    question = Question(id = "1", text = "Sample question?", difficulty = "medium"),
                    onClick = {}
                )
            }
        }
    }

    @Test
    fun `question card dark theme`() {
        paparazzi.snapshot {
            AppTheme(darkTheme = true) {
                QuestionCard(
                    question = Question(id = "1", text = "Sample question?", difficulty = "medium"),
                    onClick = {}
                )
            }
        }
    }
}

// Record screenshots: ./gradlew recordPaparazziDebug
// Verify (CI): ./gradlew verifyPaparazziDebug
```

---

## Common Mistakes

```kotlin
// ❌ No testTag — tests break when text changes
composeTestRule.onNodeWithText("Scan Question")  // breaks if string resource changes
// ✅
composeTestRule.onNodeWithTag("scan_title")

// ❌ assertIsDisplayed() on node inside collapsed container — passes even when invisible
// Use assertExists() only if you want to check it's in the tree but possibly not visible

// ❌ Hardcoded delay instead of waitUntil
Thread.sleep(2000)  // flaky
// ✅
composeTestRule.waitUntil(3_000) { /* condition */ }

// ❌ Testing ViewModel state directly
assertThat(viewModel.uiState.value.isSolving).isTrue()  // tests internals
// ✅ Test what the USER sees
composeTestRule.onNodeWithTag("solving_indicator").assertIsDisplayed()

// ❌ setContent without AppTheme — missing theme causes crashes with Material3 components
composeTestRule.setContent { ScanScreen() }
// ✅
composeTestRule.setContent { AppTheme { ScanScreen() } }
```
