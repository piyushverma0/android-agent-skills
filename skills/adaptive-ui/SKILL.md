---
name: adaptive-ui
description: |
  Adaptive UI for Android — responsive layouts for phones, tablets, foldables, Chromebooks,
  and large screens. Use this skill for EVERY screen you build. Triggers on: WindowSizeClass,
  ListDetailPaneScaffold, SupportingPaneScaffold, ThreePaneScaffold, NavigationSuiteScaffold,
  NavigationRail, NavigationDrawer, adaptive layout, responsive, tablet layout, foldable,
  FoldingFeature, two-pane, large screen, GridCells.Adaptive, WindowWidthSizeClass,
  WindowHeightSizeClass, landscape, Chromebook, bottom sheet to side sheet, dialog sizing,
  content width, LazyVerticalGrid, breakpoints, hinge, fold state. Apply to EVERY screen
  — AI agents without this produce phone-only apps on 1B+ large-screen Android devices.
---

# Adaptive UI — Every Screen, Every Device

Android has 1B+ active large-screen devices. Every screen must work on phones, tablets,
foldables, and Chromebooks. These 10 rules make that happen automatically.

## The golden rule

**Before placing any layout element: ask how it looks at 600dp width AND 840dp width.**
If the answer is "one stretched column" — it's wrong.

## Setup — required dependencies

```toml
[versions]
material3Adaptive = "1.1.0"

[libraries]
material3-adaptive = { group = "androidx.compose.material3.adaptive", name = "adaptive", version.ref = "material3Adaptive" }
material3-adaptive-layout = { group = "androidx.compose.material3.adaptive", name = "adaptive-layout", version.ref = "material3Adaptive" }
material3-adaptive-navigation = { group = "androidx.compose.material3.adaptive", name = "adaptive-navigation", version.ref = "material3Adaptive" }
windowSizeClass = { group = "androidx.compose.material3", name = "material3-window-size-class", version.ref = "material3" }
```

## Rule 1: NavigationSuiteScaffold — zero-code adaptive navigation

```kotlin
// ✅ One component → BottomBar on phone, Rail on tablet, Drawer on large screen
@Composable
fun MyApp() {
    val navController = rememberNavController()
    val currentEntry by navController.currentBackStackEntryAsState()

    NavigationSuiteScaffold(
        navigationSuiteItems = {
            TopLevelRoute.entries.forEach { route ->
                item(
                    selected = currentEntry?.destination?.hasRoute(route.routeClass) == true,
                    onClick = { navController.navigateTopLevel(route) },
                    icon = {
                        Icon(
                            if (currentEntry?.destination?.hasRoute(route.routeClass) == true)
                                route.selectedIcon else route.icon,
                            contentDescription = stringResource(route.labelRes)
                        )
                    },
                    label = { Text(stringResource(route.labelRes)) },
                    badge = if (route.badgeCount > 0) {
                        { Badge { Text("${route.badgeCount}") } }
                    } else null
                )
            }
        }
    ) {
        AppNavHost(navController)
    }
}
// Compact  (< 600dp): BottomNavigationBar
// Medium   (600-840dp): NavigationRail
// Expanded (> 840dp): NavigationDrawer (permanent)
// No extra code needed — ever.

// ✅ Define top-level routes
enum class TopLevelRoute(
    val routeClass: KClass<*>,
    val icon: ImageVector,
    val selectedIcon: ImageVector,
    @StringRes val labelRes: Int,
    val badgeCount: Int = 0
) {
    Home(HomeRoute::class, Icons.Outlined.Home, Icons.Filled.Home, R.string.home),
    Search(SearchRoute::class, Icons.Outlined.Search, Icons.Filled.Search, R.string.search),
    Inbox(InboxRoute::class, Icons.Outlined.Inbox, Icons.Filled.Inbox, R.string.inbox, badgeCount = 3),
    Profile(ProfileRoute::class, Icons.Outlined.Person, Icons.Filled.Person, R.string.profile),
}

// ✅ Top-level navigate helper — prevents duplicate backstack entries
fun NavController.navigateTopLevel(route: TopLevelRoute) {
    navigate(route.routeClass.objectInstance ?: return) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
```

## Rule 2: ListDetailPaneScaffold — master-detail for all list screens

```kotlin
// ✅ Every list+detail screen should use this — replaces simple NavHost navigation
@Composable
fun ItemsScreen() {
    val navigator = rememberListDetailPaneScaffoldNavigator<String>()

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    ListDetailPaneScaffold(
        directive   = navigator.scaffoldDirective,
        value       = navigator.scaffoldValue,
        listPane    = {
            AnimatedPane {
                ItemListPane(
                    onItemSelected = { id ->
                        navigator.navigateTo(ListDetailPaneScaffoldRole.Detail, id)
                    }
                )
            }
        },
        detailPane  = {
            AnimatedPane {
                val itemId = navigator.currentDestination?.content
                if (itemId != null) {
                    ItemDetailPane(itemId = itemId)
                } else {
                    // Large screen placeholder when nothing selected
                    Box(Modifier.fillMaxSize(), Alignment.Center) {
                        Text("Select an item", style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    )
}
// Phone: list screen → tap → detail screen (back button returns to list)
// Tablet: list + detail side by side, selection updates detail pane live
```

## Rule 3: WindowSizeClass breakpoints — 3 layout tiers

```kotlin
// ✅ Access WindowSizeClass from composable hierarchy
@Composable
fun MyScreen() {
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass
    val isCompact  = windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.COMPACT   // < 600dp
    val isMedium   = windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.MEDIUM    // 600-840dp
    val isExpanded = windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.EXPANDED  // > 840dp

    when {
        isExpanded -> ExpandedLayout()   // desktop-like, two or three columns
        isMedium   -> MediumLayout()     // tablet, two columns or wider single
        else       -> CompactLayout()    // phone, single column
    }
}

// ✅ Extension helpers (add to AdaptiveTokens.kt)
val WindowSizeClass.isCompact  get() = windowWidthSizeClass == WindowWidthSizeClass.COMPACT
val WindowSizeClass.isMedium   get() = windowWidthSizeClass == WindowWidthSizeClass.MEDIUM
val WindowSizeClass.isExpanded get() = windowWidthSizeClass == WindowWidthSizeClass.EXPANDED

// ✅ Also check height for landscape phones (compact height)
val WindowSizeClass.isShortLandscape get() =
    windowHeightSizeClass == WindowHeightSizeClass.COMPACT && !isCompact
```

## Rule 4: Adaptive Grid — fills screen width automatically

```kotlin
// ✅ GridCells.Adaptive — correct column count for any screen width
LazyVerticalGrid(
    columns = GridCells.Adaptive(minSize = 180.dp),  // as many as fit
    contentPadding = PaddingValues(Spacing.md),
    horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
    verticalArrangement   = Arrangement.spacedBy(Spacing.sm)
) {
    items(items, key = { it.id }) { item ->
        ItemCard(item, modifier = Modifier.fillMaxWidth())
    }
}
// Phone (360dp): 1 column. Standard phone (412dp): 2 columns.
// Tablet (768dp): 4 columns. Large screen (1200dp): 6 columns. Zero extra code.

// ✅ Fixed columns per breakpoint when design requires control
@Composable
fun DesignControlledGrid(items: List<Item>, windowSizeClass: WindowSizeClass) {
    val columns = when {
        windowSizeClass.isExpanded -> GridCells.Fixed(4)
        windowSizeClass.isMedium   -> GridCells.Fixed(3)
        else                       -> GridCells.Fixed(2)
    }
    LazyVerticalGrid(columns = columns) { /* ... */ }
}
```

## Rule 5: Foldable support — FoldingFeature states

```kotlin
// ✅ Detect and respond to fold states
@Composable
fun FoldAwareScreen() {
    val windowInfo = currentWindowAdaptiveInfo()
    val posture    = windowInfo.windowPosture
    val hinges     = posture.hingeList

    val foldingFeature = hinges.firstOrNull()

    when {
        foldingFeature?.state == FoldingFeature.State.HALF_OPENED &&
        foldingFeature.orientation == FoldingFeature.Orientation.HORIZONTAL -> {
            // Tabletop / book posture — split top/bottom
            TabletopLayout()
        }
        foldingFeature?.state == FoldingFeature.State.FLAT -> {
            // Fully unfolded — treat as large tablet
            ExpandedLayout()
        }
        else -> {
            // Phone / folded state
            CompactLayout()
        }
    }
}

// ✅ Tabletop layout — content above, controls below the hinge
@Composable
fun TabletopLayout() {
    Column(Modifier.fillMaxSize()) {
        // Content above hinge
        Box(Modifier.weight(1f).fillMaxWidth()) {
            VideoPlayer()   // or map, camera, media player
        }
        // Controls below hinge — easy thumb reach
        Box(Modifier.weight(0.4f).fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceContainerLow)) {
            PlaybackControls()
        }
    }
}
```

## Rule 6: Content width constraints — never stretch text on large screens

```kotlin
// ✅ Cap readable content width — typography research: 75 chars max per line
@Composable
fun ReadableContent(content: @Composable ColumnScope.() -> Unit) {
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val maxContentWidth = minOf(maxWidth, 720.dp)  // never wider than 720dp
        Box(Modifier.fillMaxSize(), Alignment.TopCenter) {
            Column(
                Modifier.width(maxContentWidth)
                    .padding(horizontal = Spacing.md)
                    .verticalScroll(rememberScrollState()),
                content = content
            )
        }
    }
}

// ✅ Adaptive horizontal padding
@Composable
fun WindowSizeClass.contentPadding() = PaddingValues(
    horizontal = when {
        isExpanded -> Spacing.xl    // 32dp on large screen
        isMedium   -> Spacing.lg    // 24dp on tablet
        else       -> Spacing.md    // 16dp on phone
    }
)
```

## Rule 7: Bottom sheet → side sheet on tablets

```kotlin
// ✅ Adapt sheet direction to screen width
@Composable
fun AdaptiveSheet(
    isVisible: Boolean,
    onDismiss: () -> Unit,
    windowSizeClass: WindowSizeClass = currentWindowAdaptiveInfo().windowSizeClass,
    content: @Composable () -> Unit
) {
    if (windowSizeClass.isCompact) {
        // Phone: bottom sheet
        if (isVisible) {
            ModalBottomSheet(onDismissRequest = onDismiss) {
                Box(Modifier.navigationBarsPadding()) { content() }
            }
        }
    } else {
        // Tablet/desktop: side sheet from end edge
        AnimatedVisibility(
            visible = isVisible,
            enter = slideInHorizontally(initialOffsetX = { it }),
            exit  = slideOutHorizontally(targetOffsetX = { it })
        ) {
            Box(
                Modifier.fillMaxHeight().width(360.dp)
                    .background(MaterialTheme.colorScheme.surfaceContainerLow)
                    .align(Alignment.CenterEnd)
            ) {
                Column {
                    Row(Modifier.fillMaxWidth().padding(Spacing.md),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically) {
                        Text("Filter", style = MaterialTheme.typography.titleMedium)
                        IconButton(onDismiss) { Icon(Icons.Default.Close, "Close") }
                    }
                    content()
                }
            }
        }
    }
}
```

## Rule 8: Adaptive dialog — constrained on large screens

```kotlin
// ✅ Alert dialogs — constrain width on tablets
@Composable
fun AppDialog(
    title: String, body: String, onConfirm: () -> Unit, onDismiss: () -> Unit,
    confirmText: String = "Confirm", dismissText: String = "Cancel"
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text  = { Text(body, style = MaterialTheme.typography.bodyMedium) },
        modifier = Modifier.widthIn(max = 400.dp),    // never full-width on tablet
        confirmButton = { TextButton(onConfirm) { Text(confirmText) } },
        dismissButton = { TextButton(onDismiss) { Text(dismissText) } }
    )
}

// ✅ Full-screen dialogs — use Dialog for complex forms on phones, keep them in-place on tablets
@Composable
fun AdaptiveFormDialog(
    isVisible: Boolean, onDismiss: () -> Unit,
    windowSizeClass: WindowSizeClass = currentWindowAdaptiveInfo().windowSizeClass,
    content: @Composable () -> Unit
) {
    if (!isVisible) return
    if (windowSizeClass.isCompact) {
        // Phone: full-screen takeover
        Dialog(onDismissRequest = onDismiss,
            properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) { content() }
        }
    } else {
        // Tablet: constrained dialog
        Dialog(onDismissRequest = onDismiss) {
            Surface(shape = MaterialTheme.shapes.large, modifier = Modifier.widthIn(max = 560.dp)) { content() }
        }
    }
}
```

## Rule 9: SupportingPaneScaffold — three-pane layouts

```kotlin
// ✅ Email/document apps: list + detail + supporting info
@Composable
fun ThreePaneScreen() {
    val navigator = rememberSupportingPaneScaffoldNavigator<String>()

    SupportingPaneScaffold(
        directive = navigator.scaffoldDirective,
        value     = navigator.scaffoldValue,
        mainPane  = {
            AnimatedPane {
                MainContent(
                    onShowDetails = { navigator.navigateTo(SupportingPaneScaffoldRole.Supporting, it) }
                )
            }
        },
        supportingPane = {
            AnimatedPane {
                SupportingContent(navigator.currentDestination?.content)
            }
        },
        extraPane = {
            AnimatedPane {
                ExtraContent()  // shown only on very large screens (> 1200dp)
            }
        }
    )
}
```

## Rule 10: Predictive Back — gesture-driven navigation preview

```kotlin
// ✅ Enable predictive back in AndroidManifest
// <application android:enableOnBackInvokedCallback="true">

// ✅ SeekableTransitionState for custom predictive back animation
@Composable
fun HomeScreen(navController: NavController) {
    val scale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMedium),
        label = "screenScale"
    )
    Box(Modifier.graphicsLayer { scaleX = scale; scaleY = scale }) {
        ScreenContent()
    }
    // NavHost 2.8+ handles predictive back automatically for composable() destinations
}
```

## Common Mistakes

❌ Hardcoded `BottomNavigation` — use `NavigationSuiteScaffold`
❌ Single-column layout on tablet — use `ListDetailPaneScaffold` for list+detail
❌ `LazyColumn` with no grid alternative on large screen — use `GridCells.Adaptive`
❌ Full-width text — cap at `720.dp` with `widthIn(max = 720.dp)`
❌ Same `ModalBottomSheet` on tablet — switch to side sheet on medium+
❌ Fixed-size dialog — use `widthIn(max = 400.dp)` always
❌ Ignoring `FoldingFeature` — check `windowPosture.hingeList` for foldables
❌ No `BackHandler` in list-detail — handle back for phone navigation

## Deep-dive references

- `references/three-pane-layouts.md` — complex SupportingPaneScaffold patterns
- `references/adaptive-testing.md` — resizable emulator testing guide
- `references/chromebook-support.md` — keyboard/mouse/trackpad support
