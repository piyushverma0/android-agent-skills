# Rule: Never run business logic in composition
**Impact:** CRITICAL

Composition should render state only. Trigger work from callbacks/effects.

```kotlin
// ❌ Wrong — invokes business logic during composition.
@Composable
fun WrongScreen(viewModel: EventViewModel = viewModel()) {
    viewModel.onSaved()
    Text(text = "Saving")
}

// ✅ Correct — invoke logic from UI events.
@Composable
fun CorrectScreen(onSaveClick: () -> Unit) {
    Button(onClick = onSaveClick) { Text(text = "Save") }
}
```
