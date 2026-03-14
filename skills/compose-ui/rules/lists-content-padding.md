# Use contentPadding, Not Outer Padding on Lazy Lists

**Impact: HIGH**

Applying `Modifier.padding()` to a `LazyColumn` clips the scroll indicator,
the over-scroll effect, and the first/last items' touch targets.

## Rule

Always use `contentPadding` parameter instead of outer `Modifier.padding()` on lazy lists.

```kotlin
// ✅ contentPadding — padding is applied to content, scroll decorations are unaffected
LazyColumn(
    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
) {
    items(list, key = { it.id }) { ItemRow(it) }
}

// ✅ For asymmetric padding (e.g., under FAB)
LazyColumn(
    contentPadding = PaddingValues(
        start = 16.dp,
        end = 16.dp,
        top = 8.dp,
        bottom = 88.dp  // space for FAB
    )
) { ... }

// ✅ Consuming Scaffold innerPadding correctly in a list
Scaffold { innerPadding ->
    LazyColumn(contentPadding = innerPadding) {
        items(list, key = { it.id }) { ItemRow(it) }
    }
}
```

## Anti-Pattern

```kotlin
// ❌ Outer padding clips scroll indicator and over-scroll glow
LazyColumn(modifier = Modifier.padding(16.dp)) {
    items(list) { ItemRow(it) }
}

// ❌ Wrapping LazyColumn in padding Box also clips it
Box(modifier = Modifier.padding(16.dp)) {
    LazyColumn { items(list) { ItemRow(it) } }
}
```

## Never Nest Scrollable Containers

```kotlin
// ❌ LazyColumn inside scrollable Column — crash or incorrect measurement
Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
    LazyColumn { items(list) { ItemRow(it) } }
}

// ✅ Use a single LazyColumn with mixed item types instead
LazyColumn {
    item { Header() }
    items(list, key = { it.id }) { ItemRow(it) }
    item { Footer() }
}
```
