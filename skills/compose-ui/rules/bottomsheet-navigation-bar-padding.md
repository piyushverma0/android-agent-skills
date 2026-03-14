# Always Add navigationBarsPadding in BottomSheet Content

**Impact: CRITICAL**

BottomSheet content extends behind the navigation bar on gesture-navigation devices.
Without `navigationBarsPadding()`, the last item and CTA buttons are hidden behind the nav bar.

## Rule

Always apply `Modifier.navigationBarsPadding()` to the root content inside `ModalBottomSheet`.

```kotlin
// ✅ Complete ModalBottomSheet setup — Material 3
var showSheet by rememberSaveable { mutableStateOf(false) }
val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

if (showSheet) {
    ModalBottomSheet(
        onDismissRequest = { showSheet = false },
        sheetState = sheetState,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        // ✅ navigationBarsPadding ensures content above the nav bar
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()      // ← mandatory
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
        ) {
            SheetContent(
                onDismiss = {
                    showSheet = false
                    // Or animate dismiss:
                    // scope.launch { sheetState.hide(); showSheet = false }
                }
            )
        }
    }
}

// ✅ Dismiss with animation (preferred over instant state change)
val scope = rememberCoroutineScope()
FilledTonalButton(
    onClick = {
        scope.launch {
            sheetState.hide()
            showSheet = false
        }
    },
    modifier = Modifier.fillMaxWidth()
) {
    Text("Dismiss")
}
```

## Anti-Pattern

```kotlin
// ❌ No navigationBarsPadding — CTA button hidden behind gesture bar
ModalBottomSheet(onDismissRequest = { showSheet = false }) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Content")
        Button(onClick = {}) { Text("Action") }  // hidden on gesture-nav phones
    }
}

// ❌ Legacy BottomSheet (not Material 3) — avoid
BottomSheetScaffold(...)  // only use for persistent sheets, not modals
```

## Sheet Height Control

```kotlin
// Skip the half-expanded state (go directly full or dismiss)
rememberModalBottomSheetState(skipPartiallyExpanded = true)

// Start at specific height using sheetMaxWidth or custom peek height
ModalBottomSheet(
    onDismissRequest = {},
    sheetState = rememberModalBottomSheetState(),
    modifier = Modifier.fillMaxHeight(0.75f)  // max 75% screen height
) { ... }
```
