# Rule: IME handling and keyboard action chain
**Impact:** CRITICAL

Use `imePadding`, `FocusRequester`, `FocusManager`, and explicit `ImeAction` chaining.

```kotlin
// ❌ Wrong — keyboard actions are not chained, focus gets stuck.
@Composable
fun WrongForm() {
    OutlinedTextField(value = "", onValueChange = {}, label = { Text("Email") })
}

// ✅ Correct — keyboard navigation is explicit and predictable.
@Composable
fun CorrectForm() {
    val focusManager = LocalFocusManager.current
    val passwordRequester = remember { FocusRequester() }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.imePadding()) {
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            keyboardActions = KeyboardActions(onNext = { passwordRequester.requestFocus() })
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.focusRequester(passwordRequester),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus() })
        )
    }
}
```
