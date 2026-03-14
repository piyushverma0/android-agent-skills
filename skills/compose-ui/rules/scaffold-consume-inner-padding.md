# Rule: Consume Scaffold innerPadding
**Impact:** CRITICAL

Always apply `innerPadding` from `Scaffold` to avoid overlap with app bars/system bars.

```kotlin
// ❌ Wrong — content ignores innerPadding.
@Composable
fun WrongScaffold() {
    Scaffold(topBar = { TopAppBar(title = { Text("Inbox") }) }) {
        LazyColumn { items(10) { Text("Item $it") } }
    }
}

// ✅ Correct — innerPadding is consumed by content.
@Composable
fun CorrectScaffold() {
    Scaffold(topBar = { TopAppBar(title = { Text("Inbox") }) }) { innerPadding ->
        LazyColumn(contentPadding = innerPadding) {
            items(items = (0..9).toList(), key = { it }) { Text("Item $it") }
        }
    }
}
```
