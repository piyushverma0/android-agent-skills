# Rule: Build adaptive layouts with WindowSizeClass
**Impact:** HIGH

Switch navigation/layout patterns by width class and keep pager + tabs synced.

```kotlin
// ❌ Wrong — one layout for all devices.
@Composable
fun WrongAdaptive(items: List<String>) {
    LazyColumn { items(items, key = { it }) { Text(it) } }
}

// ✅ Correct — adaptive nav and responsive content grid.
@Composable
fun CorrectAdaptive(widthClass: WindowWidthSizeClass, pagerState: PagerState, tabs: List<String>, items: List<String>) {
    val columns = when (widthClass) {
        WindowWidthSizeClass.Compact -> 1
        WindowWidthSizeClass.Medium -> 2
        WindowWidthSizeClass.Expanded -> 4
        else -> 1
    }

    Row {
        if (widthClass != WindowWidthSizeClass.Compact) {
            NavigationRail { NavigationRailItem(selected = true, onClick = {}, icon = { Icon(Icons.Default.Home, contentDescription = null) }) }
        }
        Column {
            TabRow(selectedTabIndex = pagerState.currentPage) {
                tabs.forEachIndexed { index, title ->
                    Tab(selected = pagerState.currentPage == index, onClick = {}, text = { Text(title) })
                }
            }
            HorizontalPager(state = pagerState) {
                LazyVerticalGrid(columns = GridCells.Fixed(columns)) {
                    items(items, key = { it }, contentType = { "card" }) { Text(it) }
                }
            }
        }
    }
}
```
