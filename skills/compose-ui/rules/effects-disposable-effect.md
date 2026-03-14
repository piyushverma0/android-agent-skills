# Use DisposableEffect for Register/Unregister Patterns

**Impact: HIGH**

Registering listeners, observers, or callbacks in `LaunchedEffect` without
cleanup causes memory leaks and duplicate registrations on recomposition.

## Rule

Use `DisposableEffect` whenever you need to register something **and** clean it up.

```kotlin
// ✅ Lifecycle observer — registered when composable enters, removed when it leaves
val lifecycleOwner = LocalLifecycleOwner.current
DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
        when (event) {
            Lifecycle.Event.ON_RESUME -> viewModel.onResume()
            Lifecycle.Event.ON_PAUSE  -> viewModel.onPause()
            else -> {}
        }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose {
        lifecycleOwner.lifecycle.removeObserver(observer)  // ← mandatory cleanup
    }
}

// ✅ Broadcast receiver
DisposableEffect(context) {
    val receiver = NetworkChangeReceiver { isConnected -> viewModel.onNetworkChange(isConnected) }
    val filter = IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
    context.registerReceiver(receiver, filter)
    onDispose { context.unregisterReceiver(receiver) }
}

// ✅ Media player / audio focus
DisposableEffect(audioManager) {
    val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).build()
    audioManager.requestAudioFocus(focusRequest)
    onDispose { audioManager.abandonAudioFocusRequest(focusRequest) }
}
```

## DisposableEffect vs LaunchedEffect

| Use case | Use |
|---|---|
| Register listener + cleanup | `DisposableEffect` |
| One-shot coroutine work | `LaunchedEffect` |
| Background coroutine that should cancel on leave | `LaunchedEffect` |
| Non-coroutine callback registration | `DisposableEffect` |

## Anti-Pattern

```kotlin
// ❌ Observer registered but never removed — memory leak
LaunchedEffect(lifecycleOwner) {
    lifecycleOwner.lifecycle.addObserver(myObserver)
    // No cleanup! Observer lives forever even after composable leaves
}
```
