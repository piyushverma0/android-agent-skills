# Rule: Use contentPadding, avoid nested scroll containers
**Impact:** HIGH

Set padding on the lazy container and avoid wrapping `LazyColumn` with another vertical scroller.

```kotlin
// ❌ Wrong — nested vertical scrolling container.
@Composable
fun WrongNestedScroll(items: List<String>) {
    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
        LazyColumn(modifier = Modifier.padding(16.dp)) {
            items(items, key = { it }) { Text(it) }
        }
    }
}

// ✅ Correct — single scroll owner with contentPadding.
@Composable
fun CorrectPadding(items: List<String>) {
    LazyColumn(contentPadding = PaddingValues(16.dp)) {
        items(items = items, key = { it }, contentType = { "row" }) { Text(it) }
    }
}
```
