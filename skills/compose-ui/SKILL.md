---
name: compose-ui
description: |
  Jetpack Compose UI best practices for AI agents building Android apps. Use this skill
  whenever writing any Composable function, building screens, handling UI state, working with
  Scaffold, LazyColumn, ModalBottomSheet, BottomSheet, edge-to-edge, IME keyboard insets,
  recomposition, side effects, LaunchedEffect, DisposableEffect, remember, collectAsStateWithLifecycle,
  StateFlow, SharedFlow, UiState, loading/error/empty states, accessibility semantics,
  Material 3 components, Coil images, TextField, animations, modifiers, or any Compose layout.
  Always apply this skill before writing any @Composable function.
---

# Compose UI

24 rules that fix what AI agents consistently get wrong in Jetpack Compose.

## CRITICAL rules — get these wrong and the app is broken

### 1. Edge-to-edge + Scaffold innerPadding

```kotlin
// ✅ Always consume Scaffold's innerPadding
Scaffold(
    topBar = { TopAppBar(title = { Text("Screen") }) },
    bottomBar = { BottomNavBar() }
) { innerPadding ->
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = innerPadding   // ← pass to content, never ignore
    ) { ... }
}

// ❌ Never ignore innerPadding — content hides under bars
Scaffold { _ ->
    LazyColumn { ... }  // content hidden under top/bottom bars
}
```

### 2. ModalBottomSheet navigation bar padding

```kotlin
// ✅ Always add navigationBarsPadding inside BottomSheet content
ModalBottomSheet(onDismissRequest = { ... }) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()   // ← required, content shifts above nav bar
            .padding(16.dp)
    ) { ... }
}

// ❌ Missing navigationBarsPadding — content hidden behind gesture nav bar
ModalBottomSheet(onDismissRequest = { ... }) {
    Column(modifier = Modifier.padding(16.dp)) { ... }
}
```

### 3. Single UiState sealed class per screen

```kotlin
// ✅ One sealed class represents all screen states
sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val items: List<Item>) : HomeUiState
    data class Error(val message: String) : HomeUiState
    data object Empty : HomeUiState
}

// ✅ Always handle all states in the Composable
@Composable
fun HomeScreen(uiState: HomeUiState) {
    when (uiState) {
        is HomeUiState.Loading -> LoadingIndicator()
        is HomeUiState.Success -> ItemList(uiState.items)
        is HomeUiState.Error -> ErrorMessage(uiState.message)
        is HomeUiState.Empty -> EmptyState()
    }
}

// ❌ Never use multiple booleans for state — causes impossible states
data class HomeState(
    val isLoading: Boolean = false,
    val isError: Boolean = false,
    val isEmpty: Boolean = false,
    val items: List<Item> = emptyList()
)
```

### 4. collectAsStateWithLifecycle — never collectAsState

```kotlin
// ✅ Lifecycle-aware collection — pauses when app is in background
val uiState by viewModel.uiState.collectAsStateWithLifecycle()

// ❌ collectAsState — keeps collecting even when app is backgrounded
val uiState by viewModel.uiState.collectAsState()
```

### 5. SharedFlow for one-shot events

```kotlin
// ✅ SharedFlow for navigation events, toasts, dialogs
class HomeViewModel : ViewModel() {
    private val _events = MutableSharedFlow<HomeEvent>()
    val events: SharedFlow<HomeEvent> = _events.asSharedFlow()

    fun onItemClick(id: String) {
        viewModelScope.launch {
            _events.emit(HomeEvent.NavigateToDetail(id))
        }
    }
}

// ✅ Collect events with LaunchedEffect
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is HomeEvent.NavigateToDetail -> navController.navigate("detail/${event.id}")
        }
    }
}

// ❌ Never use StateFlow for one-shot events — events replay on recomposition
private val _navigationEvent = MutableStateFlow<String?>(null)
```

### 6. LaunchedEffect key rules

```kotlin
// ✅ Use Unit key when effect runs once on composition
LaunchedEffect(Unit) {
    viewModel.loadData()
}

// ✅ Use value key when effect should rerun when value changes
LaunchedEffect(userId) {
    viewModel.loadUser(userId)
}

// ❌ Never use constantly-changing keys — causes infinite re-execution
LaunchedEffect(System.currentTimeMillis()) { ... }
```

### 7. No logic in composition — only rendering

```kotlin
// ✅ Logic in ViewModel, only UI state in Composable
@Composable
fun ItemCard(item: Item, onLike: (String) -> Unit) {
    Card(onClick = { onLike(item.id) }) {
        Text(item.title)
    }
}

// ❌ Never compute in composition — triggers recomposition loops
@Composable
fun ItemCard(items: List<Item>) {
    val filtered = items.filter { it.isActive }  // computation in composition!
    ...
}
```

## HIGH impact rules

### 8. LazyColumn — stable keys and contentPadding

```kotlin
// ✅ Always provide stable key= for list items
LazyColumn(
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp)
) {
    items(items, key = { it.id }) { item ->   // ← stable key prevents recompose
        ItemCard(item)
    }
}

// ❌ No key — full list recomposition on any change
LazyColumn { items(items) { item -> ItemCard(item) } }
```

### 9. Modifier order matters

```kotlin
// ✅ Correct order: size → padding → background → clickable
Modifier
    .fillMaxWidth()
    .padding(16.dp)
    .background(MaterialTheme.colorScheme.surface)
    .clickable { ... }

// ❌ Wrong order changes visual result and hit area
Modifier
    .clickable { ... }         // clickable area doesn't include padding
    .padding(16.dp)
    .fillMaxWidth()
```

### 10. AnimatedVisibility — always specify enter/exit

```kotlin
// ✅ Explicit animation specs
AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn() + expandVertically(),
    exit = fadeOut() + shrinkVertically()
) { Content() }

// ❌ Default enter/exit looks janky
AnimatedVisibility(visible = isVisible) { Content() }
```

### 11. Type-safe Navigation destinations

```kotlin
// ✅ Kotlin Serializable destinations — no string routes
@Serializable
object HomeRoute

@Serializable
data class DetailRoute(val itemId: String)

NavHost(navController, startDestination = HomeRoute) {
    composable<HomeRoute> { HomeScreen() }
    composable<DetailRoute> { backStackEntry ->
        val route: DetailRoute = backStackEntry.toRoute()
        DetailScreen(itemId = route.itemId)
    }
}

// ❌ String routes — fragile, no type safety, typos compile
navController.navigate("detail/$itemId")
composable("detail/{itemId}") { ... }
```

### 12. Remember variants — use the right one

```kotlin
// ✅ remember for values that survive recomposition but not config change
val scrollState = rememberScrollState()

// ✅ rememberSaveable for values that survive config change (rotation)
var selectedTab by rememberSaveable { mutableStateOf(0) }

// ✅ remember with key — recalculate when key changes
val computation = remember(inputList) { inputList.sortedBy { it.name } }

// ❌ remember without key for derived state — stale value
val sorted = remember { inputList.sortedBy { it.name } }  // never updates
```

### 13. DisposableEffect for cleanup

```kotlin
// ✅ DisposableEffect cleans up when composable leaves
DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
        if (event == Lifecycle.Event.ON_RESUME) viewModel.refreshData()
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
}
```

### 14. Accessibility semantics

```kotlin
// ✅ Custom actions and descriptions for non-text clickables
IconButton(
    onClick = { onLike() },
    modifier = Modifier.semantics {
        contentDescription = "Like ${item.title}"
        role = Role.Button
    }
) { Icon(Icons.Default.Favorite, contentDescription = null) }

// ✅ mergeDescendants for card accessibility
Card(
    modifier = Modifier.semantics(mergeDescendants = true) {}
) { ... }
```

### 15. TextField security

```kotlin
// ✅ Password field with correct input type
TextField(
    value = password,
    onValueChange = { password = it },
    visualTransformation = PasswordVisualTransformation(),
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
    keyboardActions = KeyboardActions(onDone = { onLogin() })
)
```

## MEDIUM impact rules

### 16. Multi-preview annotations

```kotlin
// ✅ Test across phones, large screens, and dark mode
@Preview(name = "Phone", device = Devices.PHONE)
@Preview(name = "Tablet", device = Devices.TABLET)
@Preview(name = "Dark", uiMode = Configuration.UI_MODE_NIGHT_YES)
@Composable
fun HomeScreenPreview() {
    MyAppTheme { HomeScreen(uiState = HomeUiState.Success(sampleItems)) }
}
```

### 17. Material 3 — no hardcoded colors

```kotlin
// ✅ Always use theme color roles
Text(text = title, color = MaterialTheme.colorScheme.onSurface)
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant))

// ❌ Never hardcode colors — breaks dark mode and dynamic color
Text(text = title, color = Color(0xFF333333))
```

### 18. Coil image loading

```kotlin
// ✅ AsyncImage with contentScale and placeholder
AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
        .data(url)
        .crossfade(true)
        .build(),
    contentDescription = description,
    contentScale = ContentScale.Crop,
    placeholder = painterResource(R.drawable.placeholder),
    error = painterResource(R.drawable.error_image),
    modifier = Modifier.fillMaxWidth().aspectRatio(16f/9f)
)
```

### 19. WindowInsets — IME keyboard handling

```kotlin
// ✅ Shift content above keyboard automatically
Scaffold(
    modifier = Modifier.imePadding()
) { innerPadding ->
    Column(modifier = Modifier.padding(innerPadding)) {
        TextField(value = text, onValueChange = { text = it })
    }
}
```

### 20. Runtime permissions in Compose

```kotlin
// ✅ rememberPermissionState from Accompanist/Compose Permissions
val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

LaunchedEffect(Unit) {
    if (!cameraPermission.status.isGranted) {
        cameraPermission.launchPermissionRequest()
    }
}
```

### 21. Scaffold with FAB and SnackbarHost

```kotlin
// ✅ Complete Scaffold setup
val snackbarHostState = remember { SnackbarHostState() }

Scaffold(
    topBar = { TopAppBar(title = { Text("Home") }) },
    floatingActionButton = {
        FloatingActionButton(onClick = onCreate) {
            Icon(Icons.Default.Add, contentDescription = "Create")
        }
    },
    snackbarHost = { SnackbarHost(snackbarHostState) }
) { innerPadding ->
    Content(modifier = Modifier.padding(innerPadding))
}
```

### 22. Surface vs Box — use Surface for clickable containers

```kotlin
// ✅ Surface handles elevation, ripple, shape, and color role
Surface(
    onClick = { onItemClick(item.id) },
    shape = MaterialTheme.shapes.medium,
    tonalElevation = 2.dp
) { CardContent(item) }

// ❌ Box has no elevation or ripple semantics
Box(modifier = Modifier.clickable { onItemClick(item.id) }) { CardContent(item) }
```

### 23. Stateless Composables — hoist state up

```kotlin
// ✅ Stateless composable — testable and reusable
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    TextField(value = query, onValueChange = onQueryChange, modifier = modifier)
}

// ❌ Stateful — owns state internally, hard to test, not reusable
@Composable
fun SearchBar() {
    var query by remember { mutableStateOf("") }
    TextField(value = query, onValueChange = { query = it })
}
```

### 24. Adaptive layout with WindowSizeClass

```kotlin
// ✅ Respond to window size — see adaptive-ui skill for full rules
val windowSizeClass = calculateWindowSizeClass(activity)
when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> PhoneLayout()
    WindowWidthSizeClass.Medium -> TabletLayout()
    WindowWidthSizeClass.Expanded -> DesktopLayout()
}
```

## Common Mistakes (Quick Reference)

| ❌ Wrong | ✅ Right |
|---|---|
| `collectAsState()` | `collectAsStateWithLifecycle()` |
| Ignoring `innerPadding` | `contentPadding = innerPadding` |
| Multiple state booleans | Single `sealed interface UiState` |
| String routes | `@Serializable` route objects |
| Hardcoded colors | `MaterialTheme.colorScheme.*` |
| Logic in `@Composable` | Logic in ViewModel |
| StateFlow for events | SharedFlow for events |
| No `key=` in LazyColumn | `items(list, key = { it.id })` |

## Deep-dive references

- `references/side-effects.md` — complete LaunchedEffect / DisposableEffect / SideEffect guide
- `references/state-management.md` — derivedStateOf, snapshotFlow, state in multi-module apps
- `references/compose-performance.md` — stability, skippable composables, baseline profiles
