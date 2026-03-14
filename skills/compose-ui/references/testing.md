# Compose UI Testing Deep Dive

Use this reference when implementing robust Compose tests for state, navigation, DI, and screenshots.

## 1) `createComposeRule` vs `createAndroidComposeRule`
- **createComposeRule**: pure Compose tests that do not need an Activity.
- **createAndroidComposeRule<Activity>**: tests needing Activity, navigation host, resources, or Hilt integration.

```kotlin
class CounterComposeRuleTest {
    @get:Rule
    val composeRule = createComposeRule()
}

@HiltAndroidTest
class CounterAndroidRuleTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeRule = createAndroidComposeRule<ComponentActivity>()
}
```

## 2) testTag placement
Apply `testTag` to stable interaction/assertion nodes.

```kotlin
@Composable
fun TaggedButton(onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.testTag("save_button")) {
        Text("Save")
    }
}
```

## 3) Node queries
Use semantic queries by tag/text/content description based on intent.

```kotlin
composeRule.onNodeWithTag("save_button").assertExists()
composeRule.onNodeWithText("Save").assertIsDisplayed()
composeRule.onNodeWithContentDescription("Back").assertExists()
```

## 4) User actions
Drive UI like users do.

```kotlin
composeRule.onNodeWithTag("save_button").performClick()
composeRule.onNodeWithTag("email_input").performTextInput("demo@site.com")
composeRule.onNodeWithTag("feed_list").performScrollToIndex(10)
```

## 5) Assertions
Use precise semantic assertions.

```kotlin
composeRule.onNodeWithTag("save_button").assertIsEnabled()
composeRule.onNodeWithTag("title_text").assertTextEquals("Profile")
composeRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
```

## 6) `waitUntil` for async
Synchronize with async state changes.

```kotlin
composeRule.waitUntil(timeoutMillis = 5_000) {
    composeRule.onAllNodesWithTag("content_ready").fetchSemanticsNodes().isNotEmpty()
}
```

## 7) Testing StateFlow-driven UI
Drive ViewModel state and assert rendering.

```kotlin
data class ProfileUiState(val name: String = "", val isLoading: Boolean = false)

class FakeProfileViewModel {
    private val _uiState = MutableStateFlow(ProfileUiState(isLoading = true))
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun emit(state: ProfileUiState) {
        _uiState.value = state
    }
}

@Composable
fun ProfileScreen(viewModel: FakeProfileViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    if (state.isLoading) {
        CircularProgressIndicator(modifier = Modifier.testTag("loading_indicator"))
    } else {
        Text(text = state.name, modifier = Modifier.testTag("name_text"))
    }
}

class ProfileScreenStateTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun rendersStateFlowUpdates() {
        val vm = FakeProfileViewModel()
        composeRule.setContent { ProfileScreen(viewModel = vm) }

        composeRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
        vm.emit(ProfileUiState(name = "Piyush", isLoading = false))
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("name_text").assertTextEquals("Piyush")
    }
}
```

## 8) Hilt test setup (`@HiltAndroidTest`, `@BindValue`)
Inject fakes with Hilt in instrumentation tests.

```kotlin
interface GreetingRepository { fun message(): String }
class FakeGreetingRepository : GreetingRepository { override fun message(): String = "Hello Test" }

@HiltViewModel
class GreetingViewModel @Inject constructor(
    private val repository: GreetingRepository
) : ViewModel() {
    val text: StateFlow<String> = MutableStateFlow(repository.message())
}

@HiltAndroidTest
class GreetingHiltTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @BindValue
    @JvmField
    val fakeRepository: GreetingRepository = FakeGreetingRepository()
}
```

## 9) Navigation testing with `TestNavHostController`
Assert navigation destinations from UI actions.

```kotlin
@Composable
fun HomeScreen(onOpenDetail: (Long) -> Unit) {
    Button(onClick = { onOpenDetail(42L) }, modifier = Modifier.testTag("open_detail")) {
        Text("Open")
    }
}

@Test
fun navigatesToDetail() {
    val composeRule = createComposeRule()
    lateinit var navController: TestNavHostController

    composeRule.setContent {
        val context = LocalContext.current
        navController = TestNavHostController(context).apply {
            navigatorProvider.addNavigator(ComposeNavigator())
        }
        NavHost(navController = navController, startDestination = "home") {
            composable("home") { HomeScreen(onOpenDetail = { id -> navController.navigate("detail/$id") }) }
            composable("detail/{id}") { Text("Detail") }
        }
    }

    composeRule.onNodeWithTag("open_detail").performClick()
    assert(navController.currentDestination?.route == "detail/{id}")
}
```

## 10) Paparazzi screenshot testing
Use Paparazzi for JVM screenshot regression tests.

```kotlin
class ProfilePaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    fun profileSnapshot() {
        paparazzi.snapshot {
            MaterialTheme {
                Text("Profile", modifier = Modifier.padding(16.dp))
            }
        }
    }
}
```

## Full ViewModel + Screen + Test example

```kotlin
data class LoginUiState(
    val email: String = "",
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false
)

class LoginViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(value: String) {
        _uiState.value = _uiState.value.copy(email = value)
    }

    fun onLogin() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            delay(200)
            _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true)
        }
    }
}

@Composable
fun LoginScreen(viewModel: LoginViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column {
        OutlinedTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChanged,
            modifier = Modifier.testTag("email_input")
        )
        Button(onClick = viewModel::onLogin, modifier = Modifier.testTag("login_button")) {
            Text("Login")
        }
        if (state.isLoading) {
            CircularProgressIndicator(modifier = Modifier.testTag("loading"))
        }
        if (state.isSuccess) {
            Text("Success", modifier = Modifier.testTag("success"))
        }
    }
}

class LoginScreenTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun loginFlowRendersSuccess() {
        val vm = LoginViewModel()
        composeRule.setContent { LoginScreen(viewModel = vm) }

        composeRule.onNodeWithTag("email_input").performTextInput("demo@example.com")
        composeRule.onNodeWithTag("login_button").performClick()
        composeRule.waitUntil(3_000) {
            composeRule.onAllNodesWithTag("success").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("success").assertTextEquals("Success")
    }
}
```
