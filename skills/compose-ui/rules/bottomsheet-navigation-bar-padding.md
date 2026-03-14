# Rule: ModalBottomSheet needs navigationBarsPadding
**Impact:** CRITICAL

Bottom-sheet interactive controls must avoid gesture/navigation bar overlap.

```kotlin
// ❌ Wrong — actions can be hidden by nav bar.
@Composable
fun WrongSheet(onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Button(onClick = onDismiss) { Text("Close") }
    }
}

// ✅ Correct — add navigationBarsPadding to sheet content.
@Composable
fun CorrectSheet(onDismiss: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.navigationBarsPadding().padding(16.dp)) {
            Button(onClick = onDismiss) { Text("Close") }
        }
    }
}
```
