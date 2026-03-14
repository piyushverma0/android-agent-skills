# Rule: Lazy lists require stable keys and content types
**Impact:** HIGH

Provide stable `key` and `contentType` for better item reuse and performance.

```kotlin
// ❌ Wrong — no key/contentType provided.
@Composable
fun WrongList(items: List<String>) {
    LazyColumn { items(items) { Text(it) } }
}

// ✅ Correct — explicit key and contentType.
@Composable
fun CorrectList(items: List<String>) {
    LazyColumn {
        items(items = items, key = { it }, contentType = { "text_row" }) { item ->
            Text(item)
        }
    }
}
```
