# Rule: Material 3 theming and expressive motion
**Impact:** CRITICAL

Use dynamic color (Android 12+), dark mode support, theme tokens, and spring-based expressive motion.

```kotlin
// ❌ Wrong — hardcoded color and raw text size token.
@Composable
fun WrongThemeText() {
    Text(text = "Title", color = Color.Red, fontSize = 18.sp)
}

// ✅ Correct — use M3 tokens and labeled animation.
@Composable
fun CorrectThemeText() {
    val scale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "titleScale"
    )
    Text(
        text = "Title",
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onSurface,
        modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale }
    )
}
```
