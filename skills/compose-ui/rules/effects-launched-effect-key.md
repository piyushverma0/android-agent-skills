# Key LaunchedEffect on What It Depends On

**Impact: CRITICAL**

`LaunchedEffect(Unit)` only runs once. If the effect depends on a value that
can change, it must be keyed on that value — otherwise it fires stale data or
never re-fires when needed.

## Rule

The key of `LaunchedEffect` must match exactly what the effect depends on.

```kotlin
// ✅ Keyed on userId — re-runs when user changes
LaunchedEffect(userId) {
    viewModel.loadProfile(userId)
}

// ✅ Keyed on errorMessage — re-fires snackbar each time error changes
LaunchedEffect(errorMessage) {
    if (errorMessage != null) {
        snackbarHostState.showSnackbar(errorMessage)
        viewModel.clearError()
    }
}

// ✅ Unit key is valid ONLY for collecting infinite flows (events, navigation)
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is ScanEvent.Navigate  -> navController.navigate(event.route)
            is ScanEvent.ShowToast -> Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
        }
    }
}

// ❌ Wrong — Unit key means it fires ONCE on first composition, never again
LaunchedEffect(Unit) {
    snackbarHostState.showSnackbar(errorMessage)  // shows only the first error, ignores subsequent
}

// ❌ Wrong — effect won't re-run when userId changes
LaunchedEffect(Unit) {
    viewModel.loadProfile(userId)
}
```

## Key Selection Guide

| What the effect does | Key |
|---|---|
| Load data for a specific ID | The ID |
| Show snackbar for error | The error message/object |
| Collect a one-shot event Flow | `Unit` |
| Run once on first composition | `Unit` |
| Re-run when config changes | The config object |
| Re-run on every recomposition | ❌ Not possible — use `SideEffect` instead |
