# Use Multi-Preview Annotations and PreviewParameterProvider

**Impact: MEDIUM**

Single-state, single-theme previews miss dark mode regressions, font scale issues,
and edge case UI states. Multi-previews catch these at design time.

## Rule

Define a reusable multi-preview annotation. Use `PreviewParameterProvider` for state variations.

```kotlin
// ✅ Define once in a common file — reuse across all screens
@Preview(name = "Light",      uiMode = Configuration.UI_MODE_NIGHT_NO,  showBackground = true)
@Preview(name = "Dark",       uiMode = Configuration.UI_MODE_NIGHT_YES, showBackground = true)
@Preview(name = "Large Font", fontScale = 1.5f,                          showBackground = true)
@Preview(name = "Small",      device = "spec:width=360dp,height=640dp,dpi=160")
annotation class ThemePreviews

// ✅ Apply to composables — one annotation gives 4 previews
@ThemePreviews
@Composable
private fun QuestionCardPreview() {
    AppTheme {
        QuestionCard(
            question = Question(id = "1", text = "Sample exam question?", difficulty = "medium"),
            onClick = {}
        )
    }
}

// ✅ PreviewParameterProvider — preview multiple states
class ScanUiStateProvider : PreviewParameterProvider<ScanUiState> {
    override val values = sequenceOf(
        ScanUiState(),                                      // idle
        ScanUiState(isSolving = true),                     // loading
        ScanUiState(result = sampleResult),                // success
        ScanUiState(errorMessage = "Quota exhausted"),     // error
        ScanUiState(remainingScans = 0)                    // no scans left
    )
}

@Preview(showBackground = true)
@Composable
private fun ScanScreenPreview(
    @PreviewParameter(ScanStateProvider::class) state: ScanUiState
) {
    AppTheme {
        ScanScreenContent(
            uiState = state,
            onCapture = {},
            onModeChange = {}
        )
    }
}
```

## Preview Naming Convention

```kotlin
// ✅ Always mark previews private — they're not part of the public API
// ✅ Suffix with Preview — easy to find and exclude from production
@ThemePreviews
@Composable
private fun ScanButtonPreview() { ... }

// ✅ For interactive previews (Compose 1.6+)
@Preview
@Composable
private fun ExpandableCardPreview() {
    var expanded by remember { mutableStateOf(false) }
    AppTheme {
        ExpandableCard(
            isExpanded = expanded,
            onToggle = { expanded = !expanded }
        )
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Single light-mode preview — misses dark mode regressions
@Preview
@Composable
fun QuestionCardPreview() { ... }

// ❌ Preview without AppTheme — Material3 components crash without theme
@Preview
@Composable
fun WrongPreview() {
    QuestionCard(...)  // crashes: no MaterialTheme provided
}

// ❌ Public preview function — appears in Compose tooling as a composable
@Preview
@Composable
fun PublicPreview() { ... }  // should be private
```
