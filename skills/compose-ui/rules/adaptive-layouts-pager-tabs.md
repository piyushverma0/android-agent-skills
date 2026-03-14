# Adaptive Layouts, WindowSizeClass, HorizontalPager, Tabs

**Impact: HIGH**

Android apps run on phones, tablets, foldables, and desktops.
Fixed layouts that only work on 360dp compact phones fail Play Store large-screen requirements.

## Rule

### 1. WindowSizeClass — adapt layout to screen size

```kotlin
// ✅ Adaptive navigation — bottom bar on compact, rail on medium/expanded
@Composable
fun AdaptiveNavigation(
    selectedDestination: String,
    onNavigate: (String) -> Unit,
    content: @Composable () -> Unit
) {
    val windowSizeClass = currentWindowAdaptiveInfo().windowSizeClass

    when (windowSizeClass.windowWidthSizeClass) {
        WindowWidthSizeClass.COMPACT -> {
            // Phone: bottom navigation bar
            Scaffold(
                bottomBar = {
                    NavigationBar {
                        TOP_LEVEL_DESTINATIONS.forEach { dest ->
                            NavigationBarItem(
                                selected = selectedDestination == dest.route,
                                onClick = { onNavigate(dest.route) },
                                icon = { Icon(dest.icon, contentDescription = null) },
                                label = { Text(dest.label) }
                            )
                        }
                    }
                }
            ) { innerPadding -> Box(Modifier.padding(innerPadding)) { content() } }
        }
        else -> {
            // Tablet/foldable: navigation rail
            Row(modifier = Modifier.fillMaxSize()) {
                NavigationRail {
                    TOP_LEVEL_DESTINATIONS.forEach { dest ->
                        NavigationRailItem(
                            selected = selectedDestination == dest.route,
                            onClick = { onNavigate(dest.route) },
                            icon = { Icon(dest.icon, contentDescription = null) },
                            label = { Text(dest.label) }
                        )
                    }
                }
                Box(modifier = Modifier.weight(1f)) { content() }
            }
        }
    }
}
```

### 2. useWindowDimensions — for dynamic sizing calculations

```kotlin
// ✅ useWindowDimensions — reactive to rotation and window resize
@Composable
fun ResponsiveGrid(items: List<Item>) {
    val windowInfo = currentWindowAdaptiveInfo()
    val columns = when (windowInfo.windowSizeClass.windowWidthSizeClass) {
        WindowWidthSizeClass.COMPACT  -> 1
        WindowWidthSizeClass.MEDIUM   -> 2
        else                          -> 3  // EXPANDED — tablet/desktop
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(items, key = { it.id }) { item ->
            ItemCard(item)
        }
    }
}
```

### 3. HorizontalPager — for swipeable pages (onboarding, image galleries, tabs)

```kotlin
// ✅ HorizontalPager with tab indicators
val pagerState = rememberPagerState(pageCount = { tabs.size })
val scope = rememberCoroutineScope()

Column {
    // Tab row synced with pager
    TabRow(
        selectedTabIndex = pagerState.currentPage,
        indicator = { tabPositions ->
            PagerTabIndicator(tabPositions, pagerState)   // animated indicator
        }
    ) {
        tabs.forEachIndexed { index, tab ->
            Tab(
                selected = pagerState.currentPage == index,
                onClick = { scope.launch { pagerState.animateScrollToPage(index) } },
                text = { Text(tab.title) }
            )
        }
    }

    // Pager content
    HorizontalPager(
        state = pagerState,
        modifier = Modifier.weight(1f)
    ) { page ->
        when (page) {
            0 -> GeneralTab()
            1 -> MathTab()
            2 -> PhysicsTab()
            else -> ChemistryTab()
        }
    }
}
```

### 4. Scrollable tabs for many items

```kotlin
// ✅ ScrollableTabRow when more than 4-5 tabs
ScrollableTabRow(
    selectedTabIndex = selectedTab,
    edgePadding = 16.dp
) {
    scanModes.forEachIndexed { index, mode ->
        Tab(
            selected = selectedTab == index,
            onClick = { selectedTab = index },
            text = { Text(mode) }
        )
    }
}
```

### 5. Foldable — handle hinge position

```kotlin
// ✅ Detect fold state for dual-pane layouts
@Composable
fun FoldableAwareLayout(listContent: @Composable () -> Unit, detailContent: @Composable () -> Unit) {
    val windowInfo = currentWindowAdaptiveInfo()

    if (windowInfo.windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.EXPANDED) {
        // Dual-pane layout for wide screens / unfolded foldable
        Row(modifier = Modifier.fillMaxSize()) {
            Box(modifier = Modifier.weight(0.4f)) { listContent() }
            HorizontalDivider(modifier = Modifier.fillMaxHeight().width(1.dp))
            Box(modifier = Modifier.weight(0.6f)) { detailContent() }
        }
    } else {
        // Single pane for compact / folded
        listContent()
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Hardcoded screen dimensions — breaks on tablets and foldables
val screenWidth = LocalConfiguration.current.screenWidthDp   // ❌ use WindowSizeClass
if (screenWidth > 600) { /* tablet */ }

// ❌ Dimensions.get() — not reactive to window resize
val width = LocalContext.current.resources.displayMetrics.widthPixels  // ❌

// ❌ Fixed grid columns — looks bad on tablets
LazyVerticalGrid(columns = GridCells.Fixed(2))  // ❌ always 2 regardless of screen

// ❌ BottomNavBar on large screens — violates Material navigation guidance
// Always use NavigationRail or NavigationDrawer on medium/expanded screens
```
