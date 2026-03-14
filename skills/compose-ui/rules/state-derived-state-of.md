# Rule: Use derivedStateOf for expensive derived values
**Impact:** CRITICAL

Use `derivedStateOf` when the derived value changes less often than source inputs.

```kotlin
// ❌ Wrong — recomputes on each recomposition.
@Composable
fun WrongValidation(input: String) {
    val valid = input.trim().length >= 8
    Text(text = valid.toString())
}

// ✅ Correct — derived state is memoized.
@Composable
fun CorrectValidation(input: String) {
    val valid by remember(input) { derivedStateOf { input.trim().length >= 8 } }
    Text(text = valid.toString())
}
```
