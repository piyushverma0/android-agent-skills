# Rule: Key LaunchedEffect with reactive dependency
**Impact:** CRITICAL

Use the dependency itself as the effect key; avoid `Unit` for reactive work.

```kotlin
// ❌ Wrong — query updates won't retrigger this effect.
@Composable
fun WrongSearch(query: String, onSearch: suspend (String) -> Unit) {
    LaunchedEffect(Unit) { onSearch(query) }
}

// ✅ Correct — query changes retrigger effect correctly.
@Composable
fun CorrectSearch(query: String, onSearch: suspend (String) -> Unit) {
    LaunchedEffect(query) { onSearch(query) }
}
```
