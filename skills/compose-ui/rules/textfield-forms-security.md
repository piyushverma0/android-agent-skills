# Rule: Secure TextField and form setup
**Impact:** CRITICAL

Use password transformation, autofill content hints, character limits, and keep validation in ViewModel.

```kotlin
// ❌ Wrong — password shown in plain text and no input constraint.
@Composable
fun WrongPasswordField() {
    var password by rememberSaveable { mutableStateOf("") }
    OutlinedTextField(value = password, onValueChange = { password = it })
}

// ✅ Correct — secure, constrained, and autofill-aware.
@Composable
fun CorrectPasswordField(password: String, onPasswordChange: (String) -> Unit) {
    OutlinedTextField(
        value = password,
        onValueChange = { onPasswordChange(it.take(64)) },
        visualTransformation = PasswordVisualTransformation(),
        modifier = Modifier.semantics { contentType = ContentType.None }
    )
}
```
