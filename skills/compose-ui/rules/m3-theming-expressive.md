# Material 3 Theming — Dynamic Color, Dark Mode, M3 Expressive

**Impact: CRITICAL**

Apps without proper M3 theming look outdated and break on dark mode.
Dynamic color is expected on Android 12+. M3 Expressive (2025) introduces
new motion, shapes, and components that are now the standard.

## Rule

### 1. Full theme setup — dynamic color + dark mode

```kotlin
// ui/theme/Theme.kt
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,   // ← Material You — adapts to wallpaper on Android 12+
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)   // ← wallpaper-based dark
            else dynamicLightColorScheme(context)            // ← wallpaper-based light
        }
        darkTheme -> darkColorScheme(    // ← custom dark fallback (pre-Android 12)
            primary = BrandOrange,
            secondary = BrandYellow,
            tertiary = BrandGold
        )
        else -> lightColorScheme(        // ← custom light fallback
            primary = BrandOrange,
            secondary = BrandYellow,
            tertiary = BrandGold
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
```

### 2. Color tokens — NEVER hardcode colors in composables

```kotlin
// ❌ Hardcoded — breaks dark mode
Text(text = "Answer", color = Color(0xFF212121))
Card(colors = CardDefaults.cardColors(containerColor = Color.White))

// ✅ Always use MaterialTheme tokens
Text(text = "Answer", color = MaterialTheme.colorScheme.onSurface)
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant))
```

### Color role cheat sheet

```kotlin
MaterialTheme.colorScheme.primary           // brand color — main buttons, FAB
MaterialTheme.colorScheme.onPrimary         // text/icons ON primary background
MaterialTheme.colorScheme.primaryContainer  // tinted container (chips, selected state)
MaterialTheme.colorScheme.onPrimaryContainer// text ON primaryContainer
MaterialTheme.colorScheme.secondary         // secondary accent
MaterialTheme.colorScheme.tertiary          // contrasting accent (use sparingly)
MaterialTheme.colorScheme.surface           // card/sheet background
MaterialTheme.colorScheme.surfaceVariant    // slightly tinted surface (dividers, chips)
MaterialTheme.colorScheme.background        // screen background
MaterialTheme.colorScheme.error             // error state
MaterialTheme.colorScheme.onSurface         // primary text on surface
MaterialTheme.colorScheme.onSurfaceVariant  // secondary text, icons on surface
MaterialTheme.colorScheme.outline           // borders, dividers
MaterialTheme.colorScheme.outlineVariant    // subtle borders
```

### 3. Typography — use M3 type scale

```kotlin
// ✅ Material 3 type scale — use semantic roles, not raw sizes
MaterialTheme.typography.displayLarge    // 57sp — splash screens, hero numbers
MaterialTheme.typography.displayMedium   // 45sp
MaterialTheme.typography.headlineLarge   // 32sp — page titles
MaterialTheme.typography.headlineMedium  // 28sp
MaterialTheme.typography.headlineSmall   // 24sp — section titles
MaterialTheme.typography.titleLarge      // 22sp — card titles
MaterialTheme.typography.titleMedium     // 16sp — list item titles
MaterialTheme.typography.titleSmall      // 14sp
MaterialTheme.typography.bodyLarge       // 16sp — primary body text
MaterialTheme.typography.bodyMedium      // 14sp — secondary body text
MaterialTheme.typography.bodySmall       // 12sp — captions
MaterialTheme.typography.labelLarge      // 14sp — button text
MaterialTheme.typography.labelMedium     // 12sp — chip text
MaterialTheme.typography.labelSmall      // 11sp — badge text
```

### 4. M3 Expressive components (2025 stable)

```kotlin
// ✅ LoadingIndicator — replaces CircularProgressIndicator for in-content loading
LoadingIndicator()              // morphs between shapes while loading
ContainedLoadingIndicator()     // same but with colored container

// ✅ ButtonGroup — replaces multiple side-by-side buttons
ButtonGroup {
    Button(onClick = { /*solve*/ }) { Text("Solve") }
    FilledTonalButton(onClick = { /*practice*/ }) { Text("Practice") }
}

// ✅ Spring-based motion (M3 Expressive default)
// Use spring() over tween() for interactive elements — feels more natural
animationSpec = spring(
    dampingRatio = Spring.DampingRatioMediumBouncy,
    stiffness = Spring.StiffnessMedium
)
```

### 5. Shape system

```kotlin
// ✅ Use MaterialTheme shape tokens
Card(shape = MaterialTheme.shapes.medium)       // 12dp rounded — cards
Card(shape = MaterialTheme.shapes.large)        // 16dp rounded — sheets, dialogs
Button(shape = MaterialTheme.shapes.full)       // pill shape — buttons
FilterChip(shape = MaterialTheme.shapes.small)  // 4dp rounded — chips

// Custom shape in theme setup
val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small      = RoundedCornerShape(8.dp),
    medium     = RoundedCornerShape(12.dp),
    large      = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(28.dp)
)
```

### 6. Selected/unselected states using container colors

```kotlin
// ✅ M3 pattern for selected state — primaryContainer
@Composable
fun SelectableCard(isSelected: Boolean, content: @Composable () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surfaceVariant
        ),
        border = if (isSelected)
            BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
        else null
    ) {
        content()
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Hardcoded color values — breaks dark mode
Text(color = Color.Black)           // invisible in dark mode
Box(modifier = Modifier.background(Color.White))  // same

// ❌ Material 2 components mixed with Material 3
// import androidx.compose.material.Button  ❌ (M2)
// import androidx.compose.material3.Button ✅ (M3)

// ❌ Ignoring dynamic color — misses Android 12+ personalization
val colorScheme = lightColorScheme(primary = BrandOrange)  // ❌ always static
// ✅ Check SDK version and apply dynamic color when available

// ❌ Raw TextStyle with hardcoded sp values instead of typography tokens
Text(fontSize = 16.sp, fontWeight = FontWeight.Bold)  // ❌ not themed
Text(style = MaterialTheme.typography.bodyLarge)       // ✅ themed
```
