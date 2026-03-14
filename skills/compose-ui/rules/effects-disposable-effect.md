# Rule: Use DisposableEffect for register/unregister pairs
**Impact:** CRITICAL

For listeners/receivers, always provide cleanup in `onDispose`.

```kotlin
// ❌ Wrong — registers receiver but never unregisters.
@Composable
fun WrongReceiver(context: Context, receiver: BroadcastReceiver, filter: IntentFilter) {
    LaunchedEffect(filter) { context.registerReceiver(receiver, filter) }
}

// ✅ Correct — register and unregister in DisposableEffect.
@Composable
fun CorrectReceiver(context: Context, receiver: BroadcastReceiver, filter: IntentFilter) {
    DisposableEffect(context, receiver, filter) {
        context.registerReceiver(receiver, filter)
        onDispose { context.unregisterReceiver(receiver) }
    }
}
```
