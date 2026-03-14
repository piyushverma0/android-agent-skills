# Rule: Edge-to-edge with safe insets
**Impact:** CRITICAL

Draw behind system bars with `enableEdgeToEdge()` and consume insets in Compose.

```kotlin
// ❌ Wrong — no edge-to-edge enablement and no insets consumption.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { Box(Modifier.fillMaxSize()) }
    }
}

// ✅ Correct — edge-to-edge is enabled and insets are consumed.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .windowInsetsPadding(WindowInsets.safeDrawing)
            )
        }
    }
}
```
