# Always Consume Scaffold innerPadding

**Impact: CRITICAL**

Ignoring `innerPadding` from `Scaffold` hides content behind the top app bar,
bottom navigation bar, or system bars. This is the most common Scaffold mistake.

## Rule

The `content` lambda of `Scaffold` receives `PaddingValues`. Always apply it.

```kotlin
// ✅ Correct — content starts below the TopAppBar, above bottom nav
Scaffold(
    topBar = { TopAppBar(title = { Text("Scan Question") }) },
    bottomBar = { BottomNavigationBar() }
) { innerPadding ->
    // Apply to the scrollable container's contentPadding for best results
    LazyColumn(
        contentPadding = innerPadding,  // ← consumed here
        modifier = Modifier.fillMaxSize()
    ) {
        items(questions, key = { it.id }) { QuestionCard(it) }
    }
}

// ✅ For non-list content — apply as Modifier.padding
Scaffold { innerPadding ->
    Column(modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)  // ← consumed here
    ) {
        Content()
    }
}

// ✅ With FAB — add extra bottom padding for the FAB
Scaffold(
    floatingActionButton = {
        FloatingActionButton(onClick = onScan) {
            Icon(Icons.Default.CameraAlt, contentDescription = "Scan")
        }
    }
) { innerPadding ->
    LazyColumn(
        contentPadding = innerPadding.add(bottom = 80.dp)  // space for FAB
    ) { ... }
}
```

## Anti-Pattern

```kotlin
// ❌ innerPadding ignored — content hidden behind TopAppBar and BottomBar
Scaffold(
    topBar = { TopAppBar(...) },
    bottomBar = { BottomNav() }
) { _ ->   // ← padding ignored
    Column(modifier = Modifier.fillMaxSize()) {
        Content()  // first item hidden behind TopAppBar
    }
}

// ❌ Named but unused
Scaffold { paddingValues ->
    Column { Content() }  // paddingValues declared but never used
}
```

## TopAppBar Color Variants (Material 3)

```kotlin
// Large title that collapses on scroll
TopAppBar(
    title = { Text("Scan Question") },
    navigationIcon = {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
        }
    },
    scrollBehavior = TopAppBarDefaults.enterAlwaysScrollBehavior()  // collapses on scroll
)

// Connect scroll behavior to your list
val scrollBehavior = TopAppBarDefaults.enterAlwaysScrollBehavior()
Scaffold(
    topBar = { TopAppBar(scrollBehavior = scrollBehavior) },
    modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection)
) { ... }
```
