# Hoist State to the Lowest Common Ancestor

**Impact: CRITICAL**

Stateless composables are the foundation of testable, reusable Compose UI.
State must live at the lowest point in the tree where all readers and writers can access it.

## Rule

Split every composable into a **stateless** version (takes values + lambdas) and a
**stateful** wrapper (owns the state). Pass state down, pass events up.

```kotlin
// ✅ Stateless — testable, previewable, reusable anywhere
@Composable
fun EmailField(
    value: String,
    onValueChange: (String) -> Unit,
    isError: Boolean,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        isError = isError,
        label = { Text("Email") },
        modifier = modifier.fillMaxWidth()
    )
}

// ✅ Stateful wrapper — owns the state, drives the stateless composable
@Composable
fun LoginScreen(viewModel: LoginViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    EmailField(
        value = uiState.email,
        onValueChange = viewModel::onEmailChange,
        isError = uiState.emailError != null
    )
}
```

## Why

- Stateless composables can be previewed without a ViewModel
- Testable with `ComposeTestRule` by passing direct values
- Reusable in different contexts (onboarding, settings, profile)
- Easier to reason about — composable only knows what it's given
