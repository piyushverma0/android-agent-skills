# Rule: Hoist state to the lowest common ancestor
**Impact:** CRITICAL

Keep state where it is shared, and pass state + callbacks down.

```kotlin
// ❌ Wrong — each child owns its own duplicated state.
@Composable
fun WrongParent() {
    ChildField()
    ChildField()
}

@Composable
private fun ChildField() {
    var value by rememberSaveable { mutableStateOf("") }
    OutlinedTextField(value = value, onValueChange = { value = it })
}

// ✅ Correct — state hoisted in parent and shared intentionally.
@Composable
fun CorrectParent() {
    var value by rememberSaveable { mutableStateOf("") }
    ChildField(value = value, onValueChange = { value = it })
    ChildField(value = value, onValueChange = { value = it })
}

@Composable
private fun ChildField(value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onValueChange)
}
```
