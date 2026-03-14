# Use derivedStateOf When Derived Value Changes Less Often Than Inputs

**Impact: HIGH**

Without `derivedStateOf`, values derived from frequently-changing state
(like scroll position) cause the entire composable tree to recompose on every change.

## Rule

Use `derivedStateOf` only when the derived value changes **less often** than its source.
Do not use it for simple transformations that change at the same rate.

```kotlin
// ✅ Correct — firstVisibleItemIndex changes every pixel, but showFab
// only changes when crossing index 0. derivedStateOf prevents thousands of recompositions.
val lazyListState = rememberLazyListState()
val showFab by remember {
    derivedStateOf { lazyListState.firstVisibleItemIndex > 0 }
}

// ✅ Correct — filtered list changes rarely compared to allItems reads
val filteredItems by remember(searchQuery) {
    derivedStateOf {
        allItems.filter { it.name.contains(searchQuery, ignoreCase = true) }
    }
}

// ❌ Wrong — showFab recomposes entire UI on every scroll pixel
val showFab = lazyListState.firstVisibleItemIndex > 0

// ❌ Wrong — derivedStateOf on a value that changes at the same rate as input
// (no performance benefit, just extra overhead)
val displayName by remember(user) {
    derivedStateOf { "${user.firstName} ${user.lastName}" }
}
// ✅ Better for same-rate derivations:
val displayName = "${user.firstName} ${user.lastName}"
```

## When to Use vs. Skip

| Scenario | Use derivedStateOf? |
|---|---|
| Derive from scroll position | ✅ Yes |
| Filter large list from search text | ✅ Yes |
| Boolean from another boolean | ❌ No |
| String formatting from a String | ❌ No |
| Any value that changes at the same rate as input | ❌ No |
