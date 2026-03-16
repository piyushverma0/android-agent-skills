# Theme Structure — Complete Theme Setup

**Impact: CRITICAL**

A missing or incomplete theme causes components to use wrong colors, wrong
shapes, and wrong typography. Every Android app must have a complete
MaterialTheme wrapper with all three subsystems defined.

## Complete Theme File Structure

```kotlin
// ui/theme/Theme.kt — the complete app theme
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    // Status bar color follows theme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view)
                .isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,    // defined in Type.kt
        shapes = AppShapes,            // defined in Shape.kt
        content = content
    )
}

// ui/theme/Color.kt — brand color definitions
val Brand50  = Color(0xFFE8F5E9)
val Brand100 = Color(0xFFC8E6C9)
val Brand200 = Color(0xFFA5D6A7)
val Brand400 = Color(0xFF66BB6A)
val Brand500 = Color(0xFF3DDC84)    // primary brand
val Brand600 = Color(0xFF43A047)
val Brand700 = Color(0xFF388E3C)
val Brand800 = Color(0xFF2E7D32)
val Brand900 = Color(0xFF1B5E20)

internal val LightColorScheme = lightColorScheme(
    primary = Brand500,
    onPrimary = Color.White,
    primaryContainer = Brand100,
    onPrimaryContainer = Brand900,
    secondary = Color(0xFF4A635C),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFCCE8DF),
    onSecondaryContainer = Color(0xFF07201A),
    tertiary = Color(0xFF3E6374),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFC2E8FC),
    onTertiaryContainer = Color(0xFF001F2A),
    error = Color(0xFFBA1A1A),
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    outline = Color(0xFF6F7975),
    outlineVariant = Color(0xFFBEC9C4),
    surface = Color(0xFFF5FAF6),
    onSurface = Color(0xFF171D1A),
    onSurfaceVariant = Color(0xFF404944),
    surfaceVariant = Color(0xFFDBE5DF),
    inverseSurface = Color(0xFF2B322E),
    inverseOnSurface = Color(0xFFECF2EE),
    inversePrimary = Brand200,
    background = Color(0xFFF5FAF6),
    onBackground = Color(0xFF171D1A),
    scrim = Color(0xFF000000)
)

// ui/theme/Shape.kt — shape scale
val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

// ui/theme/Type.kt — typography scale (see typography-system skill)
```

## Theme File Organization

```
ui/theme/
├── Theme.kt       ← MaterialTheme wrapper, light/dark selection
├── Color.kt       ← color definitions (brand palette + color schemes)
├── Type.kt        ← typography scale (AppTypography)
└── Shape.kt       ← shape scale (AppShapes)
```

## Accessing Theme in Composables

```kotlin
// ✅ Always access theme through MaterialTheme — never store locally
@Composable
fun SomeComponent() {
    val primary = MaterialTheme.colorScheme.primary       // color
    val titleLarge = MaterialTheme.typography.titleLarge  // text style
    val medium = MaterialTheme.shapes.medium              // shape

    // Or use directly in modifiers/params
    Box(
        modifier = Modifier
            .background(MaterialTheme.colorScheme.surfaceContainerLow)
            .clip(MaterialTheme.shapes.medium)
    )
}

// ✅ Custom theme extensions for semantic colors
val ColorScheme.success: Color
    get() = if (isLight) Color(0xFF2E7D32) else Color(0xFF81C784)

val ColorScheme.isLight: Boolean
    get() = !this.background.luminance().let { it < 0.5f }

// Usage
MaterialTheme.colorScheme.success
```

## Anti-Patterns

```kotlin
// ❌ No theme — using hardcoded M3 defaults everywhere
// App has default purple — no brand identity

// ❌ Theme defined inside a specific screen
@Composable
fun HomeScreen() {
    MaterialTheme(colorScheme = ...) {  // ❌ should be at root, not per-screen
        HomeContent()
    }
}

// ❌ Color.kt with flat list of hex values, no M3 roles
object Colors {
    val Purple = Color(0xFF6200EE)
    val White = Color.White
    val Black = Color.Black
    // ❌ no semantic roles, no dark mode variants
}

// ❌ Typography not in theme — using TextStyle directly everywhere
Text(style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold))
// ❌ Should be MaterialTheme.typography.bodyLarge
```
