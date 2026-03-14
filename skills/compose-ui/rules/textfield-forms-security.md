# TextField, Forms, and Input Security

**Impact: CRITICAL**

TextField has complex behavior around focus, keyboard types, validation, and
security. Wrong configuration exposes sensitive data or creates broken UX.

## Rules

### 1. Always use OutlinedTextField / TextField from Material 3

```kotlin
// ✅ Labeled OutlinedTextField — the standard form input in Material 3
var email by rememberSaveable { mutableStateOf("") }
var emailError by remember { mutableStateOf<String?>(null) }

OutlinedTextField(
    value = email,
    onValueChange = { input ->
        email = input
        emailError = if (input.contains("@")) null else "Invalid email address"
    },
    label = { Text("Email") },                                  // ← always provide label
    placeholder = { Text("you@example.com") },
    isError = emailError != null,
    supportingText = {
        emailError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Email,
        imeAction = ImeAction.Next
    ),
    singleLine = true,
    modifier = Modifier.fillMaxWidth()
)
```

### 2. Password fields — NEVER show raw password in TextField

```kotlin
// ✅ Password field with visibility toggle
var password by rememberSaveable { mutableStateOf("") }
var passwordVisible by remember { mutableStateOf(false) }

OutlinedTextField(
    value = password,
    onValueChange = { password = it },
    label = { Text("Password") },
    visualTransformation = if (passwordVisible)
        VisualTransformation.None
    else
        PasswordVisualTransformation(),     // ← masks characters with •
    trailingIcon = {
        IconButton(onClick = { passwordVisible = !passwordVisible }) {
            Icon(
                imageVector = if (passwordVisible) Icons.Default.VisibilityOff
                              else Icons.Default.Visibility,
                contentDescription = if (passwordVisible) "Hide password" else "Show password"
            )
        }
    },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Password,
        imeAction = ImeAction.Done
    ),
    singleLine = true,
    modifier = Modifier.fillMaxWidth()
)
```

### 3. Security — disable autocomplete on sensitive fields

```kotlin
// ✅ OTP / PIN — no autocomplete, no clipboard suggestion
BasicTextField(
    value = otp,
    onValueChange = { if (it.length <= 6) otp = it },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.NumberPassword,  // ← numeric keypad, no suggestions
        imeAction = ImeAction.Done
    ),
    modifier = Modifier
        .semantics { contentType = ContentType.None }  // ← disables autofill
)

// ✅ Credit card — suppress clipboard and autofill
OutlinedTextField(
    value = cardNumber,
    onValueChange = { cardNumber = it },
    keyboardOptions = KeyboardOptions(
        keyboardType = KeyboardType.Number
    ),
    modifier = Modifier.semantics {
        contentType = ContentType.None      // ← disables Android Autofill
    }
)
```

### 4. Autofill hints — help users, speed up form completion

```kotlin
// ✅ Correct autofill hints for standard fields (Android will suggest saved values)
OutlinedTextField(
    value = email,
    onValueChange = { email = it },
    label = { Text("Email") },
    modifier = Modifier
        .fillMaxWidth()
        .semantics {
            contentType = ContentType.EmailAddress   // ← autofill suggests saved emails
        }
)

OutlinedTextField(
    value = name,
    onValueChange = { name = it },
    label = { Text("Full name") },
    modifier = Modifier.semantics {
        contentType = ContentType.PersonFullName
    }
)

// Common ContentType values:
// ContentType.EmailAddress, ContentType.Password, ContentType.Username
// ContentType.PersonFullName, ContentType.PhoneNumber, ContentType.PostalAddress
// ContentType.NewPassword  ← triggers strong password suggestion from system
```

### 5. Input validation — validate in ViewModel, not composable

```kotlin
// ✅ Validation lives in ViewModel
class LoginViewModel @Inject constructor(...) : ViewModel() {

    fun onEmailChange(input: String) {
        _uiState.update {
            it.copy(
                email = input,
                emailError = validateEmail(input)
            )
        }
    }

    private fun validateEmail(email: String): String? {
        return when {
            email.isBlank() -> "Email is required"
            !Patterns.EMAIL_ADDRESS.matcher(email).matches() -> "Invalid email format"
            else -> null
        }
    }
}

// ✅ Composable only reads state and reports events
OutlinedTextField(
    value = uiState.email,
    onValueChange = viewModel::onEmailChange,   // ← delegate to VM
    isError = uiState.emailError != null,
    supportingText = { uiState.emailError?.let { Text(it) } }
)
```

### 6. KeyboardType — always specify correct type

```kotlin
// Match keyboard type to content for best UX
KeyboardType.Text          // default — general text
KeyboardType.Email         // shows @ and .com shortcuts
KeyboardType.Password      // hides input, disables suggestions
KeyboardType.NumberPassword// numeric only, hides input (for PIN/OTP)
KeyboardType.Number        // numeric with decimal
KeyboardType.Phone         // phone number layout with + and *
KeyboardType.Uri           // shows / and .com shortcuts
KeyboardType.Decimal       // numeric with decimal separator
```

## Security Anti-Patterns

```kotlin
// ❌ Password stored in remember — lost on rotation, not saveable anyway
var password by remember { mutableStateOf("") }  // ❌ use rememberSaveable only for non-sensitive
// ✅ Never store passwords in saved state — process with viewModel directly

// ❌ Logging user input
onValueChange = { input ->
    Log.d("DEBUG", "Input: $input")  // ❌ exposes PII in logcat
    email = input
}

// ❌ Showing raw password in UI state
data class WrongState(val password: String = "")  // ❌ never store raw passwords in state
// ✅ Store only what the ViewModel needs to process — clear after use

// ❌ No character limit on free-text fields — DoS vector
OutlinedTextField(value = text, onValueChange = { text = it })  // ❌ unbounded
// ✅
onValueChange = { if (it.length <= 500) text = it }
```
