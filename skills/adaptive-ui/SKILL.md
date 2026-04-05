---
name: adaptive-ui
description: |
  Adaptive UI for Android — responsive layouts that work on all screen sizes, foldables,
  and Chromebooks. Use this skill whenever building any screen that should work on phones,
  tablets, foldables, or large screens. Triggers on: WindowSizeClass, ListDetailPaneScaffold,
  SupportingPaneScaffold, NavigationSuiteScaffold, adaptive layout, responsive, WindowWidthSizeClass,
  WindowHeightSizeClass, tablet layout, foldable, FoldingFeature, two-pane, landscape,
  Chromebook, large screen, LazyVerticalGrid, GridCells.Adaptive, PaneScaffold, ThreePaneScaffold,
  adaptive navigation, NavigationRail, NavigationDrawer. Apply this skill to EVERY screen —
  AI agents that skip this produce phone-only apps that look broken on tablets.
---

# Adaptive UI

Android has 1B+ active large-screen devices. AI agents that ignore this ship broken apps.
These rules make every screen work on phones, tablets, foldables, and Chromebooks automatically.

## The golden rule

**Every layout decision must ask: how does this look at 600dp+ width?**
If the answer is "one column of stretched content", it's wrong.

## Step 1: Setup WindowSizeClass

```kotlin
// libs.versions.toml
adaptive = "1.0.0"
adaptive-layout = "1.0.0"

[libraries]
androidx-adaptive = { group = "androidx.compose.material3.adaptive", name = "adaptive", version.ref = "adaptive" }
androidx-adaptive-layout = { group = "androidx.compose.material3.adaptive", name = "adaptive-layout", version.ref = "adaptive-layout" }
androidx-adaptive-navigation = { group = "androidx.compose.material3.adaptive", name = "adaptive-navigation", version.ref = "adaptive-layout" }
```

```kotlin
// MainActivity.kt
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyAppTheme {
                val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
                MyApp(windowSizeClass = windowSizeClass)
            }
        }
    }
}
```

## Step 2: NavigationSuiteScaffold — auto-adapts navigation

```kotlin
// ✅ One component handles BottomBar/Rail/Drawer based on screen size
@Composable
fun MyApp(windowSizeClass: WindowSizeClass) {
    val navController = rememberNavController()
    val currentDestination by navController.currentBackStackEntryAsState()

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            TopLevelDestination.entries.forEach { destination ->
                item(
                    selected = currentDestination?.destination?.hasRoute(destination.route) == true,
                    onClick = { navController.navigate(destination.route) { launchSingleTop = true } },
                    icon = { Icon(destination.icon, contentDescription = null) },
                    label = { Text(stringResource(destination.labelRes)) }
                )
            }
        }
    ) {
        AppNavHost(navController = navController)
    }
}

// On phone (< 600dp): renders BottomNavigationBar
// On tablet (600-1200dp): renders NavigationRail
// On large screen (> 1200dp): renders NavigationDrawer
// ZERO extra code needed
```

## Step 3: ListDetailPaneScaffold — master-detail layouts

```kotlin
// ✅ The correct pattern for lists with detail views (email, settings, etc.)
@Composable
fun ItemsScreen() {
    val navigator = rememberListDetailPaneScaffoldNavigator<String>()

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    ListDetailPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                ItemListPane(
                    onItemClick = { itemId ->
                        navigator.navigateTo(ListDetailPaneScaffoldRole.Detail, itemId)
                    }
                )
            }
        },
        detailPane = {
            AnimatedPane {
                val itemId = navigator.currentDestination?.content
                if (itemId != null) {
                    ItemDetailPane(itemId = itemId)
                } else {
                    EmptyDetailPane()  // shown on large screens when nothing selected
                }
            }
        }
    )
}

// On phone: shows list OR detail (navigates between them)
// On tablet/desktop: shows list AND detail side-by-side automatically
```

## Step 4: Breakpoint-based layout decisions

```kotlin
// ✅ WindowWidthSizeClass — the primary breakpoint
@Composable
fun ProductScreen(
    windowSizeClass: WindowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
) {
    val isExpanded = windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.EXPANDED
    val isMedium = windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.MEDIUM

    when {
        isExpanded -> ProductExpandedLayout()    // > 840dp  — desktop-like
        isMedium -> ProductMediumLayout()        // 600-840dp — tablet
        else -> ProductCompactLayout()           // < 600dp  — phone
    }
}

// ✅ Helper for common patterns
@Composable
fun WindowSizeClass.isCompact() = windowWidthSizeClass == WindowWidthSizeClass.COMPACT
@Composable
fun WindowSizeClass.isExpanded() = windowWidthSizeClass == WindowWidthSizeClass.EXPANDED
```

## Step 5: Adaptive Grid — the right way to fill horizontal space

```kotlin
// ✅ GridCells.Adaptive — fills available width automatically
LazyVerticalGrid(
    columns = GridCells.Adaptive(minSize = 180.dp),   // as many columns as fit
    contentPadding = PaddingValues(16.dp),
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    verticalArrangement = Arrangement.spacedBy(8.dp)
) {
    items(items, key = { it.id }) { item ->
        ItemCard(item)
    }
}
// Phone: 2 columns. Tablet: 4-5 columns. Large screen: 6+ columns. Zero code changes.

// ✅ Fixed columns per breakpoint when design requires control
@Composable
fun ProductGrid(windowSizeClass: WindowSizeClass) {
    val columns = when (windowSizeClass.windowWidthSizeClass) {
        WindowWidthSizeClass.COMPACT -> 2
        WindowWidthSizeClass.MEDIUM -> 3
        else -> 4
    }
    LazyVerticalGrid(columns = GridCells.Fixed(columns)) { ... }
}
```

## Step 6: Foldable support

```kotlin
// ✅ Detect fold state
@Composable
fun FoldAwareLayout() {
    val windowInfo = currentWindowAdaptiveInfo()
    val foldingFeature = windowInfo.windowPosture.hingeList.firstOrNull()

    when {
        foldingFeature?.state == FoldingFeature.State.HALF_OPENED &&
        foldingFeature.orientation == FoldingFeature.Orientation.HORIZONTAL -> {
            // Book posture — show top/bottom split
            TableTopLayout()
        }
        foldingFeature?.state == FoldingFeature.State.FLAT -> {
            // Fully open like a tablet — show side-by-side
            TabletLayout()
        }
        else -> {
            // Normal phone layout
            PhoneLayout()
        }
    }
}
```

## Step 7: Content width constraints — never stretch text

```kotlin
// ✅ Limit readable content width on large screens
@Composable
fun ArticleScreen() {
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val contentWidth = if (maxWidth > 840.dp) 840.dp else maxWidth

        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .width(contentWidth)
                    .padding(horizontal = 24.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                ArticleContent()
            }
        }
    }
}

// ❌ Full-width text on large screens — 200-char lines are unreadable
Column(modifier = Modifier.fillMaxWidth()) {
    Text(text = articleBody)  // 1000dp wide text on landscape tablet
}
```

## Step 8: Adaptive padding — more space on larger screens

```kotlin
// ✅ Padding scales with screen size
@Composable
fun WindowSizeClass.contentPadding(): PaddingValues = when (windowWidthSizeClass) {
    WindowWidthSizeClass.COMPACT -> PaddingValues(horizontal = 16.dp, vertical = 12.dp)
    WindowWidthSizeClass.MEDIUM -> PaddingValues(horizontal = 24.dp, vertical = 16.dp)
    else -> PaddingValues(horizontal = 32.dp, vertical = 24.dp)
}

// Usage
LazyColumn(contentPadding = windowSizeClass.contentPadding()) { ... }
```

## Step 9: Bottom sheet → side sheet on large screens

```kotlin
// ✅ Show side sheet on tablets instead of bottom sheet
@Composable
fun FilterPanel(
    isVisible: Boolean,
    onDismiss: () -> Unit,
    windowSizeClass: WindowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
) {
    if (windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.COMPACT) {
        // Phone: bottom sheet
        if (isVisible) {
            ModalBottomSheet(onDismissRequest = onDismiss) {
                FilterContent(modifier = Modifier.navigationBarsPadding())
            }
        }
    } else {
        // Tablet: side panel
        AnimatedVisibility(
            visible = isVisible,
            enter = slideInHorizontally { it },
            exit = slideOutHorizontally { it }
        ) {
            SideSheet(onDismiss = onDismiss) {
                FilterContent()
            }
        }
    }
}
```

## Step 10: Dialog sizing — don't let dialogs fill the screen on tablets

```kotlin
// ✅ Constrain dialog width on large screens
@Composable
fun ConfirmDialog(onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.widthIn(max = 400.dp),  // max 400dp on any screen
        title = { Text("Confirm action") },
        text = { Text("Are you sure?") },
        confirmButton = { TextButton(onClick = onConfirm) { Text("Confirm") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
```

## Common Mistakes

❌ Using BottomNavigation hardcoded — use NavigationSuiteScaffold
❌ Fixed column count in grids — use GridCells.Adaptive
❌ No detail pane — use ListDetailPaneScaffold for list+detail screens
❌ Full-width text — always cap readable content at 840dp
❌ Ignoring WindowSizeClass — check it on every screen
❌ Same padding on all screens — scale padding by window size
❌ Full-screen dialogs on tablets — constrain with widthIn(max = 400.dp)
❌ Not handling FoldingFeature — test on foldable emulator

## Deep-dive references

- `references/pane-scaffold.md` — SupportingPaneScaffold for complex three-pane layouts
- `references/adaptive-testing.md` — testing adaptive layouts with resizable emulator
