# Rule: Modifier order and API shape matter
**Impact:** HIGH

Modifier order changes layout/interaction behavior. Keep `modifier` last and defaulted.

```kotlin
// ❌ Wrong — modifier parameter position and order are poor.
@Composable
fun WrongChip(modifier: Modifier, label: String, onClick: () -> Unit) {
    Text(label, Modifier.padding(8.dp).clickable(onClick = onClick).background(Color.Gray))
}

// ✅ Correct — modifier last/defaulted and 48dp target.
@Composable
fun CorrectChip(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Text(
        text = label,
        modifier = modifier
            .background(MaterialTheme.colorScheme.primaryContainer)
            .clickable(onClick = onClick)
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    )
}
```
