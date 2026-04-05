---
name: material3
description: |
  Material 3 (Material You) components and theming for Android Compose. Use this skill
  whenever working with Material 3 components, dynamic color, color roles, tonal elevation,
  TopAppBar, LargeTopAppBar, BottomAppBar, NavigationBar, NavigationRail, NavigationDrawer,
  FAB, chips, badges, SegmentedButton, DatePicker, TimePicker, SearchBar, ModalBottomSheet,
  Scaffold variants, tonal surface, surface container, container colors, M3 migration from M2,
  or any Material Design 3 component. Always apply when using any androidx.compose.material3 API.
---

# Material 3 (Material You)

Material 3 is not just a component library — it's a complete design language. These rules
ensure you use M3 correctly and consistently.

## Color roles — the right container/on-container pairs

```kotlin
// ✅ M3 color roles — always use semantic names, never raw colors
// Primary actions
Button(colors = ButtonDefaults.buttonColors(
    containerColor = MaterialTheme.colorScheme.primary,
    contentColor = MaterialTheme.colorScheme.onPrimary
))

// Elevated containers
Card(colors = CardDefaults.cardColors(
    containerColor = MaterialTheme.colorScheme.surfaceVariant,
    contentColor = MaterialTheme.colorScheme.onSurfaceVariant
))

// Secondary containers (chips, selected states)
FilterChip(
    selected = isSelected,
    colors = FilterChipDefaults.filterChipColors(
        selectedContainerColor = MaterialTheme.colorScheme.secondaryContainer,
        selectedLabelColor = MaterialTheme.colorScheme.onSecondaryContainer
    )
)

// Error states
OutlinedTextField(
    isError = hasError,
    colors = OutlinedTextFieldDefaults.colors(
        errorBorderColor = MaterialTheme.colorScheme.error,
        errorLabelColor = MaterialTheme.colorScheme.error
    )
)
```

## TopAppBar variants

```kotlin
// ✅ TopAppBar — for screens that don't scroll (or need pinned header)
@OptIn(ExperimentalMaterial3Api::class)
Scaffold(
    topBar = {
        TopAppBar(
            title = { Text("Home") },
            navigationIcon = {
                if (canGoBack) {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            },
            actions = {
                IconButton(onClick = onSearchClick) {
                    Icon(Icons.Default.Search, contentDescription = "Search")
                }
                IconButton(onClick = onMenuClick) {
                    Icon(Icons.Default.MoreVert, contentDescription = "More")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface
            )
        )
    }
) { innerPadding -> Content(modifier = Modifier.padding(innerPadding)) }

// ✅ LargeTopAppBar — for detail screens, collapses on scroll
Scaffold(
    topBar = {
        val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
        LargeTopAppBar(
            title = { Text("Article Title") },
            scrollBehavior = scrollBehavior,
            navigationIcon = {
                IconButton(onClick = onBackClick) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
            }
        )
    },
    modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection)  // required!
) { innerPadding ->
    LazyColumn(contentPadding = innerPadding) { ... }
}
```

## FAB variants

```kotlin
// ✅ Standard FAB
FloatingActionButton(
    onClick = onCreateClick,
    containerColor = MaterialTheme.colorScheme.primaryContainer,
    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
) {
    Icon(Icons.Default.Add, contentDescription = "Create")
}

// ✅ Extended FAB — more descriptive, preferred for primary actions
ExtendedFloatingActionButton(
    text = { Text("New post") },
    icon = { Icon(Icons.Default.Add, contentDescription = null) },
    onClick = onCreateClick,
    expanded = !lazyListState.isScrollingUp()  // shrinks when scrolling down
)

// ✅ Small FAB — secondary actions
SmallFloatingActionButton(onClick = onShareClick) {
    Icon(Icons.Default.Share, contentDescription = "Share")
}
```

## Chips — use the right variant

```kotlin
// ✅ FilterChip — toggle on/off, stateful
FilterChip(
    selected = isActive,
    onClick = onToggle,
    label = { Text("Active") },
    leadingIcon = if (isActive) {
        { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }
    } else null
)

// ✅ AssistChip — suggestions, smart actions
AssistChip(
    onClick = onAutoFill,
    label = { Text("Auto-fill address") },
    leadingIcon = { Icon(Icons.Default.Lightbulb, contentDescription = null) }
)

// ✅ InputChip — tags/tokens that can be removed
InputChip(
    selected = false,
    onClick = { /* nothing */ },
    label = { Text(tag) },
    trailingIcon = {
        Icon(Icons.Default.Close, contentDescription = "Remove $tag",
            modifier = Modifier.size(16.dp).clickable { onRemoveTag(tag) })
    }
)

// ✅ SuggestionChip — read-only recommendations
SuggestionChip(
    onClick = { onSuggestionClick(suggestion) },
    label = { Text(suggestion) }
)
```

## SegmentedButton — replaces radio buttons for 2-4 options

```kotlin
// ✅ Single-select segmented button
val options = listOf("Daily", "Weekly", "Monthly")
var selectedIndex by rememberSaveable { mutableStateOf(0) }

SingleChoiceSegmentedButtonRow {
    options.forEachIndexed { index, option ->
        SegmentedButton(
            selected = selectedIndex == index,
            onClick = { selectedIndex = index },
            shape = SegmentedButtonDefaults.itemShape(index, options.size),
            label = { Text(option) }
        )
    }
}
```

## Badge — notification counts

```kotlin
// ✅ BadgedBox — for nav items with notification count
BadgedBox(
    badge = {
        if (unreadCount > 0) {
            Badge { Text("$unreadCount") }
        }
    }
) {
    Icon(Icons.Default.Notifications, contentDescription = "Notifications")
}
```

## DatePicker and TimePicker

```kotlin
// ✅ DatePickerDialog
var showDatePicker by remember { mutableStateOf(false) }
val datePickerState = rememberDatePickerState()

if (showDatePicker) {
    DatePickerDialog(
        onDismissRequest = { showDatePicker = false },
        confirmButton = {
            TextButton(onClick = {
                showDatePicker = false
                val selectedDate = datePickerState.selectedDateMillis?.let {
                    Instant.fromEpochMilliseconds(it)
                }
                onDateSelected(selectedDate)
            }) { Text("OK") }
        },
        dismissButton = {
            TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
        }
    ) {
        DatePicker(state = datePickerState)
    }
}
```

## SearchBar

```kotlin
// ✅ SearchBar with suggestions
var query by rememberSaveable { mutableStateOf("") }
var active by rememberSaveable { mutableStateOf(false) }

SearchBar(
    query = query,
    onQueryChange = { query = it },
    onSearch = { onSearchSubmit(it); active = false },
    active = active,
    onActiveChange = { active = it },
    placeholder = { Text("Search items...") },
    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
    trailingIcon = {
        if (query.isNotEmpty()) {
            IconButton(onClick = { query = "" }) {
                Icon(Icons.Default.Clear, contentDescription = "Clear")
            }
        }
    }
) {
    // Suggestions shown when active = true
    searchSuggestions.forEach { suggestion ->
        ListItem(
            headlineContent = { Text(suggestion) },
            leadingContent = { Icon(Icons.Default.History, contentDescription = null) },
            modifier = Modifier.clickable {
                query = suggestion
                onSearchSubmit(suggestion)
                active = false
            }
        )
    }
}
```

## Tonal elevation — surface colors change with elevation

```kotlin
// ✅ Use tonalElevation for depth without drop shadows
Card(
    elevation = CardDefaults.cardElevation(
        defaultElevation = 0.dp,          // no drop shadow
        pressedElevation = 0.dp
    ),
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface   // tonal color applied automatically
    )
)

// Surface with explicit tonal elevation
Surface(tonalElevation = 4.dp) { ... }   // slightly elevated surface color
```

## Pull to refresh

```kotlin
// ✅ PullToRefreshBox (M3 1.3.0+)
val pullRefreshState = rememberPullToRefreshState()

PullToRefreshBox(
    isRefreshing = isRefreshing,
    onRefresh = onRefresh,
    state = pullRefreshState
) {
    LazyColumn(contentPadding = innerPadding) { ... }
}
```

## Common Mistakes

❌ Using M2 components (androidx.compose.material) — use material3 only
❌ Mixing `colorScheme.primary` with hardcoded colors in the same screen
❌ Using `TopAppBarDefaults.exitUntilCollapsedScrollBehavior()` without `nestedScroll`
❌ Using `CheckBox` where `FilterChip` is the right M3 component
❌ Using radio buttons for 2-4 options — use `SegmentedButton`
❌ Adding elevation shadow to M3 cards — use `tonalElevation` instead
❌ Not providing `contentDescription` on icon buttons — accessibility violation
