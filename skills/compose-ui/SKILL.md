---
name: compose-ui
description: |
  Jetpack Compose UI best practices for Android (BOM 2024.x, Material 3 Expressive).
  Use this skill for ANY @Composable code — state management, LazyColumn/LazyRow,
  remember/derivedStateOf, recomposition, Modifier chains, AnimatedVisibility,
  ModalBottomSheet, Scaffold, TopAppBar, navigation-compose, edge-to-edge insets,
  IME keyboard handling, accessibility (contentDescription, semantics, TalkBack),
  TextField security, loading/error/empty states, Material 3 theming, dynamic color,
  dark mode, adaptive layouts, WindowSizeClass, HorizontalPager, Coil image loading,
  runtime permissions, LaunchedEffect, DisposableEffect, SharedFlow events, @Preview.
---

# Jetpack Compose UI

Production-complete Compose best practices. 24 rules across 10 categories, ordered by impact.

## Setup

```kotlin
// build.gradle.kts (app)
val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
implementation(composeBom)
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.ui:ui-tooling-preview")
implementation("androidx.compose.material3:material3")
implementation("androidx.activity:activity-compose:1.9.2")
implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.5")
implementation("androidx.navigation:navigation-compose:2.8.1")
implementation("io.coil-kt.coil3:coil-compose:3.0.0")
implementation("io.coil-kt.coil3:coil-network-okhttp:3.0.0")
implementation("com.google.accompanist:accompanist-permissions:0.36.0")
debugImplementation("androidx.compose.ui:ui-tooling")
android { buildFeatures { compose = true } }
```

---

## CRITICAL — Layout & Insets

### 1. Edge-to-Edge — mandatory on Android 15+

```kotlin
// MainActivity.kt — call BEFORE setContent
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()   // ← handles SDK compat back to API 21
        setContent { AppTheme { App() } }
    }
}

// AndroidManifest.xml — enables IME insets
// android:windowSoftInputMode="adjustResize"
```

```kotlin
// Inset modifier cheat sheet
Modifier.statusBarsPadding()         // top status bar
Modifier.navigationBarsPadding()     // bottom nav bar
Modifier.systemBarsPadding()         // both
Modifier.imePadding()                // software keyboard
Modifier.safeDrawingPadding()        // status + nav + cutout (use for full-screen content)

// Full-screen content (camera, hero images) — full bleed bg, interactive layer uses insets
Box(modifier = Modifier.fillMaxSize()) {
    HeroImage(modifier = Modifier.fillMaxSize())           // draws behind status bar
    Column(modifier = Modifier.fillMaxSize().systemBarsPadding()) {
        TopControls()
        Spacer(modifier = Modifier.weight(1f))
        BottomControls()
    }
}
```

### 2. IME / Keyboard Handling

```kotlin
// ✅ imePadding on the container — content animates above keyboard
Column(modifier = Modifier.fillMaxSize().imePadding()) {
    MessageList(modifier = Modifier.weight(1f))
    MessageInputBar()   // stays above keyboard
}

// ✅ FocusRequester — auto-focus on screen open
val focusRequester = remember { FocusRequester() }
LaunchedEffect(Unit) { focusRequester.requestFocus() }
TextField(modifier = Modifier.focusRequester(focusRequester), ...)

// ✅ FocusManager — dismiss keyboard programmatically
val focusManager = LocalFocusManager.current
Button(onClick = { focusManager.clearFocus(); viewModel.submit() }) { Text("Submit") }

// ✅ ImeAction chain for multi-field forms
OutlinedTextField(
    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) })
)
```

### 3. Always Consume Scaffold innerPadding

```kotlin
// ❌ Content hidden behind TopAppBar + BottomBar
Scaffold(topBar = { ... }) { _ -> Column { Content() } }

// ✅
Scaffold(topBar = { ... }) { innerPadding ->
    LazyColumn(contentPadding = innerPadding) {
        items(list, key = { it.id }) { ItemRow(it) }
    }
}
```

### 4. navigationBarsPadding in BottomSheet — mandatory

```kotlin
// ❌ CTA hidden behind gesture bar
ModalBottomSheet(onDismissRequest = {}) { Column { Button { Text("Action") } } }

// ✅
ModalBottomSheet(
    onDismissRequest = { showSheet = false },
    sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()     // ← mandatory
            .padding(horizontal = 20.dp)
            .padding(bottom = 32.dp)
    ) { SheetContent() }
}
```

---

## CRITICAL — State Management

### 5. Single UiState Data Class Per Screen

```kotlin
// ✅ One data class, one StateFlow, atomic updates
data class ScanUiState(
    val isSolving: Boolean = false,
    val result: ScanSolveResponse? = null,
    val errorMessage: String? = null,
    val remainingScans: Int = 5
)

private val _uiState = MutableStateFlow(ScanUiState())
val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()
_uiState.update { it.copy(isSolving = true, errorMessage = null) }

// In Composable — collectAsStateWithLifecycle, NEVER collectAsState
// (pauses when backgrounded — saves battery)
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

### 6. One-Shot Events via SharedFlow

```kotlin
// ✅ Navigation, toasts, snackbars → SharedFlow (never stored in UiState — re-fires on rotation)
sealed interface ScanEvent {
    data class ShowError(val message: String) : ScanEvent
    data class Navigate(val route: String)    : ScanEvent
    object QuotaExhausted                     : ScanEvent
}

private val _events = MutableSharedFlow<ScanEvent>()
val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

// Composable
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is ScanEvent.Navigate    -> navController.navigate(event.route)
            is ScanEvent.ShowError   -> snackbarHostState.showSnackbar(event.message)
            ScanEvent.QuotaExhausted -> navController.navigate(Screen.Upgrade.route)
        }
    }
}
```

### 7. Correct remember Variant

```kotlin
remember { mutableStateOf(false) }       // ephemeral UI — lost on rotation
rememberSaveable { mutableStateOf("") }  // user input — survives rotation + process death
remember { mutableIntStateOf(0) }        // primitives — NEVER mutableStateOf<Int>
rememberCoroutineScope()                 // for event handlers only, never inline
```

### 8. Hoist State, Never Logic in Composition

```kotlin
// ✅ Stateless composable
@Composable
fun EmailField(value: String, onValueChange: (String) -> Unit, isError: Boolean,
               modifier: Modifier = Modifier) {
    OutlinedTextField(value = value, onValueChange = onValueChange, isError = isError,
        label = { Text("Email") }, modifier = modifier.fillMaxWidth())
}

// ❌ Logic in composition — runs on EVERY recompose
@Composable fun Wrong(items: List<Item>) { val sorted = items.sortedBy { it.name } }
// ✅ In ViewModel via StateFlow, or: remember(items) { items.sortedBy { it.name } }
```

### 9. derivedStateOf — only when derived changes less than inputs

```kotlin
// ✅ Prevents recompose on every scroll pixel
val showFab by remember { derivedStateOf { lazyListState.firstVisibleItemIndex > 0 } }
// ❌ Recomposes entire UI on every pixel
val showFab = lazyListState.firstVisibleItemIndex > 0
```

---

## CRITICAL — Side Effects

### 10. Key LaunchedEffect on Its Dependency

```kotlin
LaunchedEffect(userId) { viewModel.loadProfile(userId) }          // ✅ re-runs when userId changes
LaunchedEffect(errorMessage) {
    if (errorMessage != null) { snackbarHostState.showSnackbar(errorMessage); viewModel.clearError() }
}
LaunchedEffect(Unit) { viewModel.events.collect { ... } }          // ✅ Unit valid for hot flows only

// ❌ Unit key — never re-fires when errorMessage changes
LaunchedEffect(Unit) { snackbarHostState.showSnackbar(errorMessage) }
```

### 11. DisposableEffect for Register/Unregister

```kotlin
DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
        if (event == Lifecycle.Event.ON_RESUME) viewModel.refresh()
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }  // ← mandatory
}
```

---

## CRITICAL — Accessibility

### 12. contentDescription on Every Interactive Element

```kotlin
// ✅ Icon buttons — non-null description always
IconButton(onClick = onBack) {
    Icon(Icons.AutoMirrored.Filled.ArrowBack,
        contentDescription = stringResource(R.string.cd_navigate_back))
}
// ✅ Decorative images — null to skip TalkBack
Image(painter = heroPainter, contentDescription = null)

// ✅ Merge semantics for compound components
Row(modifier = Modifier.semantics(mergeDescendants = true) {}) {
    Icon(Icons.Default.Star, contentDescription = null)
    Text("4.5 rating")   // TalkBack reads: "4.5 rating"
}

// ✅ Minimum 48dp touch target
IconButton(onClick = onClose, modifier = Modifier.size(48.dp)) {
    Icon(Icons.Default.Close, contentDescription = "Close", modifier = Modifier.size(24.dp))
}

// ✅ stateDescription for dynamic state
Card(modifier = Modifier.semantics { stateDescription = if (expanded) "expanded" else "collapsed" }) { }
// ✅ heading() for section titles — enables landmark navigation
Text("Results", modifier = Modifier.semantics { heading() })
// ✅ liveRegion for dynamic content updates
Text("Score: $score", modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
```

---

## CRITICAL — TextField & Forms

### 13. TextField Security and Keyboard Types

```kotlin
// ✅ Password — always PasswordVisualTransformation + visibility toggle
OutlinedTextField(
    value = password,
    onValueChange = { password = it },
    visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
    singleLine = true
)

// ✅ Autofill hints — help users, speed up forms
OutlinedTextField(
    modifier = Modifier.semantics { contentType = ContentType.EmailAddress },
    ...
)

// ✅ Sensitive fields — disable autofill
OutlinedTextField(
    modifier = Modifier.semantics { contentType = ContentType.None }, // OTP, PIN, card number
    ...
)

// ✅ Validation in ViewModel, not composable
// ✅ Character limit on all free-text fields
onValueChange = { if (it.length <= 500) text = it }

// ❌ Never log user input — exposes PII
// ❌ Never store passwords in UiState/SavedState
```

---

## CRITICAL — UX States

### 14. Loading, Error, and Empty States — Never Skip

```kotlin
// ✅ Model all states
sealed interface ScreenState {
    object Loading : ScreenState
    data class Success(val data: Data) : ScreenState
    data class Error(val message: String, val isRetryable: Boolean = true) : ScreenState
    object Empty : ScreenState
}

// ✅ Render all states
when (state) {
    is ScreenState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
        CircularProgressIndicator()
    }
    is ScreenState.Success -> SuccessContent(state.data)
    is ScreenState.Error   -> Column(Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.ErrorOutline, null, Modifier.size(48.dp),
            tint = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(16.dp))
        Text(state.message, textAlign = TextAlign.Center)
        if (state.isRetryable) {
            Spacer(Modifier.height(24.dp))
            Button(onClick = onRetry) { Text("Try again") }
        }
    }
    is ScreenState.Empty   -> Column(Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.SearchOff, null, Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(16.dp))
        Text("No results", style = MaterialTheme.typography.titleMedium)
        Text("Tap + to add your first item", color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ✅ Pull-to-refresh
PullToRefreshBox(isRefreshing = uiState.isRefreshing, onRefresh = onRefresh) {
    LazyColumn { items(list, key = { it.id }) { ItemRow(it) } }
}
```

---

## CRITICAL — Material 3 Theming

### 15. Dynamic Color, Dark Mode, Color Tokens

```kotlin
// ✅ Theme setup with dynamic color (Android 12+) and dark mode
@Composable
fun AppTheme(darkTheme: Boolean = isSystemInDarkTheme(), dynamicColor: Boolean = true,
             content: @Composable () -> Unit) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> darkColorScheme(primary = BrandOrange, secondary = BrandYellow)
        else      -> lightColorScheme(primary = BrandOrange, secondary = BrandYellow)
    }
    MaterialTheme(colorScheme = colorScheme, typography = AppTypography, shapes = AppShapes,
        content = content)
}

// ❌ Hardcoded colors — break dark mode
Text(color = Color.Black)
// ✅ Always theme tokens
Text(color = MaterialTheme.colorScheme.onSurface)
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant))

// ✅ Typography — semantic roles, not raw sizes
Text(style = MaterialTheme.typography.titleLarge)   // not fontSize = 22.sp
Text(style = MaterialTheme.typography.bodyMedium)   // not fontSize = 14.sp

// ✅ M3 Expressive spring motion (2025 standard)
animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)
```

---

## HIGH — Lists

### 16. Stable Keys in LazyColumn

```kotlin
// ❌ Full rebind on every update, animations broken
items(questions) { QuestionCard(it) }
// ✅
LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
    items(questions, key = { it.id }, contentType = { it.type }) { question ->
        QuestionCard(question, onClick = { onQuestionClick(question.id) })
    }
    item(key = "footer") { if (isLoading) LoadingIndicator() }
}
```

### 17. contentPadding — Never Outer Padding on Lazy Lists

```kotlin
// ❌ Clips scroll indicator
LazyColumn(modifier = Modifier.padding(16.dp)) { ... }
// ✅
LazyColumn(contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)) { ... }
// ❌ Nested scroll containers — crash
Column(modifier = Modifier.verticalScroll(...)) { LazyColumn { ... } }
```

---

## HIGH — Modifier Chains

### 18. Modifier Order and Touch Targets

```kotlin
// padding + background order changes visual output
Modifier.background(Color.Red).padding(16.dp)  // padding INSIDE color
Modifier.padding(16.dp).background(Color.Red)  // padding OUTSIDE color
// clickable before padding = larger touch target
Modifier.clickable { }.padding(16.dp)          // ✅
// Every public composable: modifier as last param, defaulted
@Composable fun Card(title: String, modifier: Modifier = Modifier) { ... }
```

---

## HIGH — Animations

### 19. AnimatedVisibility with Explicit Specs

```kotlin
// ❌ Snaps — no transition
AnimatedVisibility(visible = show) { Content() }
// ✅
AnimatedVisibility(
    visible = uiState.isSolving,
    enter = fadeIn(tween(300)) + slideInVertically(tween(340)) { it / 3 },
    exit  = fadeOut(tween(200)) + slideOutVertically(tween(200)) { it / 3 }
) { SolvingIndicator() }

// ✅ label is required on every animate*AsState (Animation Inspector)
val rotation by animateFloatAsState(if (expanded) 180f else 0f, tween(300), label = "chevron")
```

---

## HIGH — Navigation

### 20. Type-Safe Routes

```kotlin
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object ScanResult : Screen("scan_result/{id}") {
        const val ARG = "id"
        fun createRoute(id: String) = "scan_result/$id"
    }
}
// ✅ Navigate with route helper
navController.navigate(Screen.ScanResult.createRoute(question.id))
// ✅ Pass primitive IDs only — fetch full object in destination ViewModel
```

---

## HIGH — Adaptive Layouts

### 21. WindowSizeClass for Tablet, Foldable, Desktop

```kotlin
val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
when (windowSizeClass.windowWidthSizeClass) {
    WindowWidthSizeClass.COMPACT -> BottomNavScaffold(content)    // phone
    else                         -> NavRailScaffold(content)       // tablet / foldable
}

// ✅ Responsive grid
val columns = when (windowSizeClass.windowWidthSizeClass) {
    WindowWidthSizeClass.COMPACT  -> 1
    WindowWidthSizeClass.MEDIUM   -> 2
    else                          -> 3
}
LazyVerticalGrid(columns = GridCells.Fixed(columns)) { ... }

// ✅ HorizontalPager with synced TabRow
val pagerState = rememberPagerState(pageCount = { tabs.size })
TabRow(selectedTabIndex = pagerState.currentPage) {
    tabs.forEachIndexed { i, tab ->
        Tab(selected = pagerState.currentPage == i,
            onClick = { scope.launch { pagerState.animateScrollToPage(i) } },
            text = { Text(tab) })
    }
}
HorizontalPager(state = pagerState) { page -> TabContent(page) }
```

---

## HIGH — Images & Permissions

### 22. Coil Image Loading

```kotlin
// ✅ AsyncImage with size constraint (prevents OOM for thumbnails)
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(imageUrl)
        .crossfade(true)
        .size(128, 128)                            // ← only load what you display
        .build(),
    contentDescription = stringResource(R.string.cd_image),
    contentScale = ContentScale.Crop,
    placeholder = painterResource(R.drawable.img_placeholder),
    error = painterResource(R.drawable.img_error),
    modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f).clip(RoundedCornerShape(12.dp))
)
```

### 23. Runtime Permissions

```kotlin
val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)
when {
    cameraPermission.status.isGranted          -> CameraPreview()
    cameraPermission.status.shouldShowRationale -> RationaleCard(onRequest = { cameraPermission.launchPermissionRequest() })
    else                                        -> RequestCard(onRequest = { cameraPermission.launchPermissionRequest() })
}
// ✅ API 33+ images: READ_MEDIA_IMAGES not READ_EXTERNAL_STORAGE
// ✅ Never request on app launch — request when user needs the feature
```

---

## MEDIUM — Previews

### 24. Multi-Preview + PreviewParameterProvider

```kotlin
@Preview(name = "Light", uiMode = UI_MODE_NIGHT_NO, showBackground = true)
@Preview(name = "Dark",  uiMode = UI_MODE_NIGHT_YES, showBackground = true)
@Preview(name = "Large Font", fontScale = 1.5f, showBackground = true)
annotation class ThemePreviews

@ThemePreviews
@Composable
private fun QuestionCardPreview() {
    AppTheme { QuestionCard(question = sampleQuestion, onClick = {}) }
}

class ScanStateProvider : PreviewParameterProvider<ScanUiState> {
    override val values = sequenceOf(ScanUiState(), ScanUiState(isSolving = true),
        ScanUiState(errorMessage = "Quota exhausted"))
}
@Preview(showBackground = true)
@Composable
private fun ScanPreview(@PreviewParameter(ScanStateProvider::class) state: ScanUiState) {
    AppTheme { ScanScreenContent(uiState = state) }
}
// ❌ Always mark previews private
// ❌ Never preview without AppTheme — M3 components crash
```

---

## References

- `references/animations.md` — Full animation API: all enter/exit specs, Crossfade, updateTransition, rememberInfiniteTransition, Animatable, AnimatedContent, shared elements, AnimationSpec guide. Read when adding any animation.
- `references/testing.md` — ComposeTestRule variants, testTag placement, node finders, actions, assertions, waitUntil, Hilt setup, navigation testing, Paparazzi. Read when writing Compose UI tests.
- `rules/` — 24 individual rule files with full examples and anti-patterns. Each file is the authoritative source for its rule.
