---
name: material3
description: |
  Material 3 Expressive components and theming for Android AI agents. Use this skill for
  any M3 component: TopAppBar, LargeTopAppBar, CenterAlignedTopAppBar, BottomAppBar, FAB,
  ExtendedFAB, NavigationBar, NavigationRail, NavigationDrawer, NavigationSuiteScaffold,
  ModalBottomSheet, Chip (Filter/Assist/Input/Suggestion), Badge, SegmentedButton, DatePicker,
  TimePicker, SearchBar, Slider, Switch, Checkbox, RadioButton, ListItem, Divider,
  ProgressIndicator, Snackbar, Tooltip, PullToRefreshBox, ExposedDropdownMenuBox,
  Card/ElevatedCard/OutlinedCard, shape morphing, MotionScheme, dynamic color,
  tonal elevation, surface containers, color roles, M3 migration from M2.
  Always apply when using any androidx.compose.material3 API.
---

# Material 3 Expressive — Complete Component Reference

M3 Expressive (Compose material3 1.4+) brings physics-based motion, shape morphing,
and a MotionScheme. These rules cover every component correctly.

## TopAppBar variants — correct scroll behavior

```kotlin
// ✅ Standard TopAppBar — pinned, for screens with minimal scroll
@OptIn(ExperimentalMaterial3Api::class)
Scaffold(
    topBar = {
        TopAppBar(
            title = { Text("Home") },
            navigationIcon = {
                if (canGoBack) IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                }
            },
            actions = {
                IconButton(onSearch)  { Icon(Icons.Default.Search,   "Search") }
                IconButton(onMenu)    { Icon(Icons.Default.MoreVert, "More") }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor         = MaterialTheme.colorScheme.surface,
                scrolledContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                titleContentColor      = MaterialTheme.colorScheme.onSurface,
            )
        )
    }
) { innerPadding -> Content(Modifier.padding(innerPadding)) }

// ✅ LargeTopAppBar — collapses on scroll, for detail/article screens
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleScreen() {
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    Scaffold(
        topBar = {
            LargeTopAppBar(
                title = { Text("Article title") },
                navigationIcon = { IconButton(onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor         = MaterialTheme.colorScheme.surface,
                    scrolledContainerColor = MaterialTheme.colorScheme.surfaceContainer,
                )
            )
        },
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection)   // REQUIRED
    ) { innerPadding ->
        LazyColumn(contentPadding = innerPadding) { /* ... */ }
    }
}

// ✅ CenterAlignedTopAppBar — home screens, feeds
CenterAlignedTopAppBar(title = { Text("App name") }, actions = { /* ... */ })
```

## FAB variants — choose by context

```kotlin
// ✅ Standard FAB — primary action on most screens
FloatingActionButton(
    onClick = onCreate,
    containerColor = MaterialTheme.colorScheme.primaryContainer,
    contentColor   = MaterialTheme.colorScheme.onPrimaryContainer,
    shape = MaterialTheme.shapes.large   // 16dp — M3 default
) { Icon(Icons.Default.Add, "Create") }

// ✅ ExtendedFAB — expands/shrinks on scroll for more clarity
val isScrollingDown by remember { derivedStateOf { listState.lastScrolledForward } }

ExtendedFloatingActionButton(
    text     = { Text("New post") },
    icon     = { Icon(Icons.Default.Add, null) },
    onClick  = onCreate,
    expanded = !isScrollingDown,
    containerColor = MaterialTheme.colorScheme.primaryContainer
)

// ✅ LargeFAB — prominent primary action on empty states
LargeFloatingActionButton(onClick = onCreate) {
    Icon(Icons.Default.Add, "Create", Modifier.size(36.dp))
}

// ✅ SmallFAB — secondary or supporting action
SmallFloatingActionButton(onClick = onShare) {
    Icon(Icons.Default.Share, "Share")
}
```

## Chips — correct variant for each use case

```kotlin
// ✅ FilterChip — toggle state (categories, tags, filters)
FilterChip(
    selected = isActive,
    onClick  = onToggle,
    label    = { Text("Active") },
    leadingIcon = if (isActive) {
        { Icon(Icons.Default.Check, null, Modifier.size(FilterChipDefaults.IconSize)) }
    } else null
)

// ✅ AssistChip — smart suggestions, quick actions
AssistChip(
    onClick = onAutoFill,
    label   = { Text("Auto-fill address") },
    leadingIcon = { Icon(Icons.Default.Lightbulb, null, Modifier.size(AssistChipDefaults.IconSize)) }
)

// ✅ InputChip — user-added tags/tokens, removable
InputChip(
    selected = false,
    onClick  = { },
    label    = { Text(tag) },
    trailingIcon = {
        IconButton(onClick = { onRemove(tag) }, modifier = Modifier.size(InputChipDefaults.IconSize)) {
            Icon(Icons.Default.Close, "Remove $tag", Modifier.size(InputChipDefaults.IconSize))
        }
    }
)

// ✅ SuggestionChip — read-only recommendations
SuggestionChip(onClick = { onApply(suggestion) }, label = { Text(suggestion) })
```

## SegmentedButton — replaces RadioButton for 2-5 options

```kotlin
// ✅ Single-select — period, view mode, sort order
val options = listOf("Day", "Week", "Month")
var selected by rememberSaveable { mutableStateOf(0) }

SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
    options.forEachIndexed { index, option ->
        SegmentedButton(
            selected = selected == index,
            onClick  = { selected = index },
            shape    = SegmentedButtonDefaults.itemShape(index, options.size),
            icon     = { SegmentedButtonDefaults.Icon(selected == index) },
            label    = { Text(option) }
        )
    }
}

// ✅ Multi-select — filter checkboxes
val selected = remember { mutableStateSetOf<String>() }
MultiChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
    filters.forEachIndexed { index, filter ->
        SegmentedButton(
            checked  = filter in selected,
            onCheckedChange = { if (it) selected.add(filter) else selected.remove(filter) },
            shape    = SegmentedButtonDefaults.itemShape(index, filters.size),
            label    = { Text(filter) }
        )
    }
}
```

## SearchBar — M3 expandable search

```kotlin
// ✅ SearchBar with suggestions and history
var query  by rememberSaveable { mutableStateOf("") }
var active by rememberSaveable { mutableStateOf(false) }

SearchBar(
    inputField = {
        SearchBarDefaults.InputField(
            query        = query,
            onQueryChange = { query = it },
            onSearch     = { onSearch(it); active = false },
            expanded     = active,
            onExpandedChange = { active = it },
            placeholder  = { Text("Search...") },
            leadingIcon  = { Icon(Icons.Default.Search, null) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton({ query = "" }) { Icon(Icons.Default.Clear, "Clear") }
                }
            }
        )
    },
    expanded = active,
    onExpandedChange = { active = it },
    modifier = Modifier.fillMaxWidth()
) {
    // Suggestions when expanded
    searchSuggestions.forEach { suggestion ->
        ListItem(
            headlineContent = { Text(suggestion) },
            leadingContent  = { Icon(Icons.Default.History, null) },
            modifier = Modifier.clickable { query = suggestion; onSearch(suggestion); active = false }
        )
        HorizontalDivider()
    }
}
```

## ListItem — consistent list rows

```kotlin
// ✅ ListItem — correct for all list content
ListItem(
    headlineContent   = { Text(item.title, style = MaterialTheme.typography.bodyLarge) },
    supportingContent = { Text(item.subtitle, style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant) },
    leadingContent    = {
        AsyncImage(model = item.imageUrl, contentDescription = null,
            modifier = Modifier.size(56.dp).clip(MaterialTheme.shapes.small))
    },
    trailingContent   = {
        IconButton(onClick = { onMore(item.id) }) {
            Icon(Icons.Default.MoreVert, "More options")
        }
    },
    tonalElevation = 0.dp,
    modifier = Modifier.clickable { onItemClick(item.id) }
)
```

## DatePicker and TimePicker

```kotlin
// ✅ Modal DatePicker
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDatePicker(
    onDateSelected: (LocalDate?) -> Unit,
    onDismiss: () -> Unit
) {
    val state = rememberDatePickerState()
    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton({
                val ms = state.selectedDateMillis
                onDateSelected(ms?.let { Instant.fromEpochMilliseconds(it).toLocalDateTime(TimeZone.currentSystemDefault()).date })
                onDismiss()
            }) { Text("OK") }
        },
        dismissButton = { TextButton(onDismiss) { Text("Cancel") } }
    ) { DatePicker(state) }
}
```

## PullToRefreshBox — M3 1.3+

```kotlin
// ✅ Pull to refresh with PullToRefreshBox
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RefreshableScreen(isRefreshing: Boolean, onRefresh: () -> Unit) {
    val pullState = rememberPullToRefreshState()
    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh    = onRefresh,
        state        = pullState
    ) {
        LazyColumn { /* content */ }
    }
}
```

## Snackbar with action

```kotlin
// ✅ SnackbarHost in Scaffold + show from ViewModel event
val snackbarHostState = remember { SnackbarHostState() }

Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { innerPadding ->
    Content(Modifier.padding(innerPadding))
}

// Collect SnackbarEvent from ViewModel
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        if (event is AppEvent.ShowSnackbar) {
            val result = snackbarHostState.showSnackbar(
                message    = event.message,
                actionLabel = event.actionLabel,
                duration    = SnackbarDuration.Short
            )
            if (result == SnackbarResult.ActionPerformed) event.onAction()
        }
    }
}
```

## Badge — notification counts

```kotlin
// ✅ BadgedBox on nav items
BadgedBox(
    badge = {
        if (count > 0) Badge(containerColor = MaterialTheme.colorScheme.error) {
            Text("${if (count > 99) "99+" else count}",
                color = MaterialTheme.colorScheme.onError,
                style = MaterialTheme.typography.labelSmall)
        }
    }
) { Icon(Icons.Default.Notifications, "Notifications") }
```

## Tonal elevation — surface color, no shadows

```kotlin
// ✅ Use surfaceContainerX for layered depth — no drop shadows in M3
// Level 0: background
// Level 1: surfaceContainerLowest — cards floating on white bg
// Level 2: surfaceContainer — standard card
// Level 3: surfaceContainerHigh — active/selected state
// Level 4: surfaceContainerHighest — top-most surface (modal header)

Card(colors = CardDefaults.cardColors(
    containerColor = MaterialTheme.colorScheme.surfaceContainer
))

// ✅ tonalElevation on Surface adds color tint automatically
Surface(tonalElevation = 3.dp) { /* slightly elevated */ }
// DO NOT use elevation + shadow in M3 — use tonal surface colors instead
```

## ExposedDropdownMenuBox — combobox / select

```kotlin
// ✅ Dropdown select field
var expanded by remember { mutableStateOf(false) }
var selected by rememberSaveable { mutableStateOf(options.first()) }

ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
    OutlinedTextField(
        value = selected,
        onValueChange = {},
        readOnly = true,
        label = { Text("Category") },
        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
        modifier = Modifier.menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable).fillMaxWidth()
    )
    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
        options.forEach { option ->
            DropdownMenuItem(
                text    = { Text(option) },
                onClick = { selected = option; expanded = false },
                leadingIcon = if (option == selected) { { Icon(Icons.Default.Check, null) } } else null
            )
        }
    }
}
```

## Common Mistakes

❌ M2 components (`androidx.compose.material`) mixed with M3 — causes visual inconsistency
❌ `nestedScroll` missing with `LargeTopAppBar` — scroll behavior won't work
❌ Using `RadioButton` for 2-4 options — use `SegmentedButton`
❌ Drop shadows on cards (`elevation = 4.dp`) — use `surfaceContainer` colors instead
❌ No `contentDescription` on icon-only buttons — accessibility violation
❌ `FilterChip` leading icon not sized with `FilterChipDefaults.IconSize` — renders too large
❌ `SegmentedButton` without `SegmentedButtonDefaults.itemShape()` — corners wrong
❌ `SearchBar` in older API style — use new `inputField` parameter (M3 1.3+)
