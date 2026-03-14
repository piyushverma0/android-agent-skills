# Edge-to-Edge and Window Insets — Android 15+ Mandatory

**Impact: CRITICAL**

Android 15 (API 35) enforces edge-to-edge by default. Without correct insets handling,
content renders under the status bar, navigation bar, and keyboard.
This is the most common production layout bug in modern Android apps.

## Rule

### 1. MainActivity setup (one-time, mandatory)

```kotlin
// MainActivity.kt
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()   // ← call BEFORE setContent — handles SDK compat back to API 21
        setContent {
            AppTheme {
                App()
            }
        }
    }
}
```

```xml
<!-- AndroidManifest.xml — required for IME insets to work -->
<activity
    android:name=".ui.MainActivity"
    android:windowSoftInputMode="adjustResize"  <!-- ← enables IME size as insets -->
    android:exported="true" />
```

### 2. Inset modifier cheat sheet

```kotlin
// System bars (status + navigation)
Modifier.statusBarsPadding()        // top status bar only
Modifier.navigationBarsPadding()    // bottom nav bar only
Modifier.systemBarsPadding()        // both top + bottom

// IME (software keyboard)
Modifier.imePadding()               // pushes content above keyboard when shown

// Display cutout (notch/camera hole on edge)
Modifier.displayCutoutPadding()

// Combined safe areas
Modifier.safeDrawingPadding()       // status + nav + cutout (most common for full-screen content)
Modifier.safeContentPadding()       // safeDrawing + gesture exclusions

// Size modifiers (for Spacers that fill inset space)
Modifier.windowInsetsTopHeight(WindowInsets.statusBars)
Modifier.windowInsetsBottomHeight(WindowInsets.navigationBars)
```

### 3. Insets DO NOT double-apply — nesting is safe

```kotlin
// ✅ Inner inset modifiers know what outer ones already consumed
Scaffold { innerPadding ->
    // innerPadding already includes system bars from Scaffold
    LazyColumn(contentPadding = innerPadding) {
        item {
            // ✅ This statusBarsPadding() does NOT double-pad
            // (Scaffold already consumed the top inset)
            TopBanner(modifier = Modifier.statusBarsPadding())
        }
    }
}
```

### 4. Full-screen content (hero images, camera, maps)

```kotlin
// ✅ Full bleed background, interactive elements avoid system bars
Box(modifier = Modifier.fillMaxSize()) {
    // Hero image goes full bleed — draws behind status bar
    HeroImage(modifier = Modifier.fillMaxSize())

    // Interactive layer respects insets
    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()  // ← keeps buttons/text safe
    ) {
        TopControls()
        Spacer(modifier = Modifier.weight(1f))
        BottomControls()
    }
}
```

### 5. Non-Scaffold screens — apply insets manually

```kotlin
// ✅ When NOT using Scaffold, apply insets yourself
@Composable
fun CameraScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()  // ← replaces Scaffold's innerPadding
    ) {
        CameraPreview(modifier = Modifier.fillMaxSize())
        ShutterButton(modifier = Modifier.align(Alignment.BottomCenter))
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Deprecated on API 35 — no longer prevents edge-to-edge
WindowCompat.setDecorFitsSystemWindows(window, true)

// ❌ Using hardcoded padding instead of inset modifiers
// Breaks on different devices and nav bar heights
Column(modifier = Modifier.padding(top = 24.dp, bottom = 48.dp)) { }

// ❌ Missing enableEdgeToEdge() — content hidden behind bars on Android 15+
override fun onCreate(...) {
    setContent { App() }  // ❌ missing enableEdgeToEdge()
}

// ❌ Missing windowSoftInputMode — keyboard hides content instead of pushing it up
// (fix in AndroidManifest.xml, not in code)
```

## WindowInsets types reference

| Type | What it avoids |
|---|---|
| `WindowInsets.statusBars` | Top status bar |
| `WindowInsets.navigationBars` | Bottom/side nav bar |
| `WindowInsets.systemBars` | Status + navigation |
| `WindowInsets.ime` | Software keyboard |
| `WindowInsets.displayCutout` | Notch / camera cutout |
| `WindowInsets.safeDrawing` | All of the above combined |
| `WindowInsets.safeGestures` | System gesture areas |
| `WindowInsets.safeContent` | safeDrawing + safeGestures |
