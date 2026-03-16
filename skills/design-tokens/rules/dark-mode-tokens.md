# Dark Mode — Correct Token Usage for Both Themes

**Impact: CRITICAL**

Dark mode is not "invert the colors." It requires a separate color scheme
where every token is independently chosen for readability and visual comfort
on dark backgrounds. Apps that just swap white↔black look harsh and wrong.

## What Changes in Dark Mode

```kotlin
// Light mode → Dark mode transformation rules:

// 1. Background: white (#FAFAFA) → dark gray (#1C1B1F), NOT black (#000000)
//    Pure black is too harsh. Dark gray (#1C1B1F) is M3 standard.
//    OLED-specific "true black" mode is an opt-in, not default.

// 2. Surface: white → slightly lighter than background
//    Light: surface = #FFFFFF, background = #FAFAFA (surface slightly lighter)
//    Dark:  surface = #1C1B1F, surfaceContainer = #211F26 (surface slightly lighter)

// 3. Primary color: often LIGHTER in dark mode for contrast
//    Light: primary = #006C51 (dark green on white = readable)
//    Dark:  primary = #68DBA8 (light green on dark = readable)
//    The primary color SHIFTS to maintain contrast, not stay the same

// 4. Text: #212121 (dark) → #E6E1E5 (light) — NOT pure white
//    Pure white text on dark bg causes eye strain
//    Slightly off-white (#E6E1E5) is M3 standard for onBackground in dark

// 5. Elevation: shadows invisible → tonal overlays
//    Dark mode uses lightened surface tints to show elevation (see elevation-system skill)
```

## Correct Dark Color Scheme

```kotlin
internal val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF68DBA8),           // lighter green for dark bg
    onPrimary = Color(0xFF003826),
    primaryContainer = Color(0xFF005139),
    onPrimaryContainer = Color(0xFF84F7C3),

    secondary = Color(0xFFB1CCC3),
    onSecondary = Color(0xFF1D352E),
    secondaryContainer = Color(0xFF334B44),
    onSecondaryContainer = Color(0xFFCCE8DF),

    tertiary = Color(0xFFA6CCE0),
    onTertiary = Color(0xFF083545),
    tertiaryContainer = Color(0xFF244C5C),
    onTertiaryContainer = Color(0xFFC2E8FC),

    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),

    background = Color(0xFF0F1511),        // very dark green-tinted dark
    onBackground = Color(0xFFDEE4DF),

    surface = Color(0xFF0F1511),
    onSurface = Color(0xFFDEE4DF),
    onSurfaceVariant = Color(0xFFBEC9C4),
    surfaceVariant = Color(0xFF404944),

    outline = Color(0xFF89938E),
    outlineVariant = Color(0xFF404944),

    inverseSurface = Color(0xFFDEE4DF),
    inverseOnSurface = Color(0xFF2B322E),
    inversePrimary = Color(0xFF006C51),

    surfaceContainerLowest = Color(0xFF0A0F0C),
    surfaceContainerLow = Color(0xFF171D1A),
    surfaceContainer = Color(0xFF1B211E),
    surfaceContainerHigh = Color(0xFF252C28),
    surfaceContainerHighest = Color(0xFF303732),
)
```

## Dark Mode — What Agents Commonly Get Wrong

```kotlin
// ❌ Using same hex for both light and dark
val primary = Color(0xFF006C51)  // defined once, used in both themes
// Dark background + dark green text = invisible

// ❌ Conditionally choosing between black and white
val textColor = if (isDarkTheme) Color.White else Color.Black
// Pure white and pure black are both wrong extremes
// ✅ Use MaterialTheme.colorScheme.onBackground — automatically correct

// ❌ Image backgrounds in dark mode
Box(modifier = Modifier.background(Color.Black)) {
    Image(/* full screen background image */)  // images don't need background color
}
// In dark mode, image cards should have surface container, not black background

// ❌ Status bar not adapted for dark mode
// Status bar stays white with dark icons even in dark mode
// ✅ Use WindowCompat.getInsetsController().isAppearanceLightStatusBars = !darkTheme

// ❌ Splash screen not themed
// <windowBackground> hardcoded white — shows white flash in dark mode
// ✅ Use windowSplashScreenBackground in themes.xml for both light and dark

// ❌ Hardcoded drawable tints
Icon(
    painter = painterResource(id = R.drawable.ic_home),
    tint = Color.Black  // ❌ invisible in dark mode
)
// ✅ tint = MaterialTheme.colorScheme.onSurface

// ❌ Dialog scrim too dark in dark mode
// M3 uses 32% opacity black scrim — correct for both modes
// Don't change scrim opacity per theme
```

## Per-Screen Theme Override (Dark Camera, Light Document)

```kotlin
// Some screens force a specific theme regardless of system setting
// Example: camera viewfinder always dark (phone camera style)
// Example: document reader can be light (reading mode)

@Composable
fun CameraScreen() {
    // Force dark theme for camera viewfinder — always looks better
    AppTheme(darkTheme = true) {
        CameraContent()
    }
}

@Composable
fun DocumentReaderScreen(userPrefersDark: Boolean) {
    // User-controlled per screen — not forced
    AppTheme(darkTheme = userPrefersDark) {
        DocumentContent()
    }
}
```
