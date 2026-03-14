# Rule: Use the correct remember variant
**Impact:** CRITICAL

Use `remember` for ephemeral UI values, `rememberSaveable` for restoration, and primitive state APIs like `mutableIntStateOf`.

```kotlin
// ❌ Wrong — count resets after process recreation.
@Composable
fun WrongCounter() {
    var count by remember { mutableStateOf(0) }
    Text(text = "$count")
}

// ✅ Correct — saveable primitive state.
@Composable
fun CorrectCounter() {
    var count by rememberSaveable { mutableIntStateOf(0) }
    Button(onClick = { count += 1 }) { Text(text = "$count") }
}
```
