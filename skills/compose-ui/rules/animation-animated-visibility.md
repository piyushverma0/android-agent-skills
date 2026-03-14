# Rule: Use explicit animation specs and labels
**Impact:** HIGH

`AnimatedVisibility` should define enter/exit transitions; `animate*AsState` should always include `label`.

```kotlin
// ❌ Wrong — default enter/exit and unlabeled animation.
@Composable
fun WrongAnimation(visible: Boolean) {
    val alpha by animateFloatAsState(targetValue = if (visible) 1f else 0f)
    AnimatedVisibility(visible = visible) { Text("Hello", Modifier.alpha(alpha)) }
}

// ✅ Correct — explicit transitions + animation label.
@Composable
fun CorrectAnimation(visible: Boolean) {
    val alpha by animateFloatAsState(targetValue = if (visible) 1f else 0f, label = "contentAlpha")
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn() + expandVertically(),
        exit = fadeOut() + shrinkVertically()
    ) {
        Text("Hello", Modifier.alpha(alpha))
    }
}
```
