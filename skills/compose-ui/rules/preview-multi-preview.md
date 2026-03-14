# Rule: Use multi-preview annotations with state providers
**Impact:** MEDIUM

Use a reusable preview annotation, `PreviewParameterProvider`, private previews, and theme wrappers.

```kotlin
// ❌ Wrong — public preview with no theme and no state coverage.
@Preview
@Composable
fun WrongPreview() {
    Text("Preview")
}

// ✅ Correct — private preview, themed, parameterized states.
sealed interface PreviewUiState {
    data object Loading : PreviewUiState
    data object Empty : PreviewUiState
}

@Preview(name = "Light")
@Preview(name = "Dark", uiMode = Configuration.UI_MODE_NIGHT_YES)
annotation class ThemePreviews

class PreviewStateProvider : PreviewParameterProvider<PreviewUiState> {
    override val values: Sequence<PreviewUiState> = sequenceOf(PreviewUiState.Loading, PreviewUiState.Empty)
}

@ThemePreviews
@Composable
private fun CorrectPreview(@PreviewParameter(PreviewStateProvider::class) state: PreviewUiState) {
    MaterialTheme { Text(text = state.toString()) }
}
```
