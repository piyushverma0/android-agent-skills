# Handle IME (Keyboard) Insets Correctly

**Impact: CRITICAL**

When the software keyboard opens, content is obscured unless layouts respond to
IME insets. This is universally broken in apps that don't handle it explicitly.

## Rule

### 1. TextField at bottom of screen — use imePadding()

```kotlin
// ✅ imePadding() on the Column pushes content above the keyboard
@Composable
fun ChatScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()   // ← animates content above keyboard as it opens
    ) {
        MessageList(modifier = Modifier.weight(1f))
        MessageInputBar()    // ← stays above keyboard
    }
}
```

### 2. List with TextField at bottom — imePadding + Spacer pattern

```kotlin
// ✅ IME padding on LazyColumn, Spacer for nav bar at end
// ⚠️ Use Spacer, NOT contentPadding, when list contains TextField (avoids IME occlusion)
LazyColumn(
    modifier = Modifier
        .fillMaxSize()
        .imePadding()       // ← whole list shifts up with keyboard
) {
    items(messages, key = { it.id }) { MessageRow(it) }

    item {
        TextField(
            value = input,
            onValueChange = { input = it },
            modifier = Modifier.fillMaxWidth()
        )
    }

    // ✅ Spacer at end handles nav bar — do NOT use contentPadding for this
    item {
        Spacer(Modifier.windowInsetsBottomHeight(WindowInsets.systemBars))
    }
}
```

### 3. FocusRequester — auto-focus a field on screen open

```kotlin
// ✅ Auto-focus TextField when screen appears (e.g. search screen)
@Composable
fun SearchScreen() {
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    TextField(
        value = query,
        onValueChange = { query = it },
        modifier = Modifier
            .fillMaxWidth()
            .focusRequester(focusRequester)
    )
}
```

### 4. FocusManager — dismiss keyboard programmatically

```kotlin
// ✅ Clear focus on "Submit" or tap outside
val focusManager = LocalFocusManager.current

Button(onClick = {
    focusManager.clearFocus()   // ← dismisses keyboard
    viewModel.submit()
}) {
    Text("Submit")
}

// ✅ Dismiss keyboard on tap outside any TextField
Box(
    modifier = Modifier
        .fillMaxSize()
        .clickable(
            indication = null,
            interactionSource = remember { MutableInteractionSource() }
        ) {
            focusManager.clearFocus()
        }
)
```

### 5. Multi-field forms — keyboard action chain

```kotlin
// ✅ Tab through fields with ImeAction
val focusManager = LocalFocusManager.current

OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Email,
        imeAction = ImeAction.Next       // ← shows "Next" on keyboard
    ),
    keyboardActions = KeyboardActions(
        onNext = { focusManager.moveFocus(FocusDirection.Down) }
    )
)

OutlinedTextField(
    value = password,
    onValueChange = { password = it },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Password,
        imeAction = ImeAction.Done       // ← shows "Done" on keyboard
    ),
    keyboardActions = KeyboardActions(
        onDone = {
            focusManager.clearFocus()
            viewModel.login()
        }
    )
)
```

## Anti-Patterns

```kotlin
// ❌ No IME handling — keyboard covers the TextField
Column(modifier = Modifier.fillMaxSize()) {
    MessageList(modifier = Modifier.weight(1f))
    MessageInputBar()   // ← hidden behind keyboard
}

// ❌ contentPadding for TextField-containing LazyColumn — IME may still hide input
LazyColumn(contentPadding = PaddingValues(bottom = 80.dp)) {
    item { TextField(...) }  // ❌ use Spacer + imePadding instead
}

// ❌ Hardcoded keyboard height — fragile, wrong on many devices
Modifier.padding(bottom = 300.dp)  // ❌ keyboards have different heights

// ❌ adjustPan in AndroidManifest — deprecated, unpredictable behavior
android:windowSoftInputMode="adjustPan"  // ❌ use adjustResize
```
