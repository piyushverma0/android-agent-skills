# Dynamic Color — Material You Wallpaper-Based Theming

**Impact: HIGH**

Material You generates a full color scheme from the user's wallpaper on
Android 12+. Apps that don't support dynamic color feel out of place on
modern Android devices. Apps that implement it incorrectly break on older
Android versions or lose their brand identity.

## Correct Dynamic Color Implementation

```kotlin
// Theme.kt — production-correct dynamic color setup
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,  // enabled by default on Android 12+
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        // Dynamic color — Android 12+ only
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        // Fallback for Android < 12 — use brand colors
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}

// ✅ Define brand fallback color schemes for Android < 12
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF3DDC84),         // Android green brand
    onPrimary = Color(0xFF000000),
    primaryContainer = Color(0xFFB8F5D4),
    onPrimaryContainer = Color(0xFF002114),
    secondary = Color(0xFF4CAF50),
    onSecondary = Color(0xFFFFFFFF),
    // ... define all required roles
    background = Color(0xFFFCFCFC),
    onBackground = Color(0xFF1C1B1F),
    surface = Color(0xFFFCFCFC),
    onSurface = Color(0xFF1C1B1F),
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF3DDC84),
    onPrimary = Color(0xFF003919),
    primaryContainer = Color(0xFF005227),
    onPrimaryContainer = Color(0xFF75FBB2),
    // ... dark variants of all roles
    background = Color(0xFF1C1B1F),
    onBackground = Color(0xFFE6E1E5),
    surface = Color(0xFF1C1B1F),
    onSurface = Color(0xFFE6E1E5),
)
```

## Category-Specific Dynamic Color Decisions

```
Fintech (banking, payments):
  → DISABLE dynamic color for trust-critical apps
  → Brand recognition (HDFC red, SBI blue, Paytm blue) is legally important
  → dynamicColor = false always
  → Fixed, carefully chosen color scheme communicates authority

Edtech (courses, learning):
  → ENABLE dynamic color — personalization feels welcoming
  → Users spend hours in the app — their wallpaper color feels comfortable
  → dynamicColor = true

Healthtech (fitness, wellness):
  → ENABLE — personal wellness apps benefit from personalization
  → Exception: medical/clinical apps → disable for professional feel

Ecommerce (shopping):
  → OPTIONAL — depends on brand strength
  → Strong brand (Amazon, Flipkart) → disable (brand consistency matters)
  → Generic/white-label apps → enable

Social (feeds):
  → ENABLE — social apps benefit from feeling personal and customized
  → dynamicColor = true

Enterprise:
  → DISABLE — corporate apps need brand consistency
  → IT managers need predictable, brandable appearance
```

## Anti-Patterns

```kotlin
// ❌ No version check — crashes on Android < 12
val colorScheme = dynamicLightColorScheme(context)  // ❌ minSdk < 31

// ❌ No fallback scheme — solid colors instead of proper M3 scheme
if (Build.VERSION.SDK_INT >= 31) {
    dynamicLightColorScheme(context)
} else {
    lightColorScheme()  // ❌ all default purple — no brand identity
}

// ❌ Dynamic color enabled for fintech with strong brand
// User's wallpaper is pink → banking app turns pink → loses trustworthiness
dynamicColor = true  // in a banking app — wrong

// ❌ Not testing without dynamic color
// Always test on Android 11 emulator — that's what ~40% of devices run
```
