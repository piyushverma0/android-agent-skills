# Rule: Accessibility semantics are mandatory
**Impact:** CRITICAL

Provide meaningful descriptions for interactive elements, `null` for decorative images, merged semantics, `stateDescription`, `liveRegion`, and 48dp touch targets.

```kotlin
// ❌ Wrong — missing semantics and poor accessibility metadata.
@Composable
fun WrongA11y(onClick: () -> Unit) {
    IconButton(onClick = onClick) {
        Icon(imageVector = Icons.Default.Settings, contentDescription = "")
    }
}

// ✅ Correct — complete semantics and touch target guarantees.
@Composable
fun CorrectA11y(enabled: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .clickable(onClick = onClick)
            .semantics(mergeDescendants = true) {
                stateDescription = if (enabled) "Enabled" else "Disabled"
                liveRegion = LiveRegionMode.Polite
                heading()
            }
            .padding(12.dp)
    ) {
        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings")
        Image(painter = painterResource(android.R.drawable.ic_menu_gallery), contentDescription = null)
    }
}
```
