---
name: design-tokens
description: |
  Material 3 design system foundation for Android apps. Use this skill for ANY
  theming, color, spacing, shape, or elevation work — MaterialTheme, colorScheme,
  ColorScheme roles, lightColorScheme, darkColorScheme, dynamicColorScheme,
  primary/secondary/tertiary/surface/background tokens, onSurface, onBackground,
  surfaceContainer, outline, spacing scale, 4dp grid, shape tokens, RoundedCornerShape,
  Shapes, elevation, tonalElevation, shadowElevation, dark mode, isSystemInDarkTheme,
  Material You, dynamic color, brand colors, semantic colors, Theme.kt, Color.kt.
  Applies to ALL app categories: fintech, edtech, healthtech, ecommerce, social,
  proptech, enterprise, productivity, entertainment, food, travel.
---

# Design Tokens

The complete Material 3 design system foundation for Android. Every color,
spacing value, elevation, and shape in a production app must come from this
system. 22 rules covering all categories globally.

---

## CRITICAL — Color System

### Rule 1: Always Use Semantic Color Roles — Never Hardcode

```kotlin
// ✅ Every color references MaterialTheme
Text(color = MaterialTheme.colorScheme.onSurface)           // primary text
Text(color = MaterialTheme.colorScheme.onSurfaceVariant)    // secondary text
Box(Modifier.background(MaterialTheme.colorScheme.surfaceContainerLow))  // card bg
Icon(tint = MaterialTheme.colorScheme.onSurfaceVariant)     // secondary icon

// ❌ Hardcoded hex — breaks dark mode and dynamic color
Text(color = Color(0xFF212121))
Box(Modifier.background(Color.White))
```

**The 6 color families — each has a surface + on-surface pair:**
- `primary` / `onPrimary` — brand color, key interactive elements
- `secondary` / `onSecondary` — supporting brand color
- `tertiary` / `onTertiary` — accent, contrasting highlight
- `error` / `onError` — errors, destructive actions
- `surface` / `onSurface` — cards, sheets (use `onSurfaceVariant` for secondary text)
- `background` / `onBackground` — page background

**Container variants** — for filled backgrounds:
`primaryContainer`/`onPrimaryContainer`, `secondaryContainer`/`onSecondaryContainer`

**Surface containers** — layered depth (lowest→low→default→high→highest)

**Always pair correctly:** content on `primaryContainer` uses `onPrimaryContainer`, never `onSurface`.

---

### Rule 2: Theme Structure — Complete Theme.kt Required

```kotlin
// ✅ Complete theme with dynamic color + fallback
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
        darkTheme -> DarkColorScheme   // your brand dark scheme
        else -> LightColorScheme       // your brand light scheme
    }
    MaterialTheme(colorScheme = colorScheme, typography = AppTypography,
        shapes = AppShapes, content = content)
}

// Theme files: Color.kt · Type.kt · Shape.kt · Theme.kt
// ❌ Defining theme inside a specific screen
// ❌ No dark color scheme defined — only light
// ❌ lightColorScheme() with no arguments — all M3 default purple, no brand
```

---

### Rule 3: Dark Mode — Shift Colors, Don't Invert

Dark mode is not `if(dark) Color.White else Color.Black`. Every semantic role
needs an independently chosen dark variant.

- Background: `#FAFAFA` → `#1C1B1F` (dark gray, NOT black)
- Primary: dark green `#006C51` → light green `#68DBA8` (shifts to maintain contrast)
- Text: `#212121` → `#E6E1E5` (off-white, not pure white)
- Status bar: light icons when `darkTheme = true`

```kotlin
// ✅ Status bar adapts to theme
SideEffect {
    WindowCompat.getInsetsController(window, view)
        .isAppearanceLightStatusBars = !darkTheme
}
// ❌ Status bar stays white icons in dark mode
```

---

### Rule 4: Dynamic Color — Enable Correctly with Version Check

```kotlin
// ✅ Android 12+ gets wallpaper color, older gets brand fallback
dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
    if (darkTheme) dynamicDarkColorScheme(context)
    else dynamicLightColorScheme(context)
}

// Category guidance:
// DISABLE: fintech (HDFC, Paytm), enterprise — brand = trust
// ENABLE:  edtech, healthtech, social — personalization = comfort
// OPTIONAL: ecommerce (depends on brand strength)
// ❌ No version check — crashes on Android < 12
// ❌ No fallback scheme — plain M3 purple on old devices
```

---

### Rule 5: Semantic Colors for Status and Finance

```kotlin
// ✅ Define semantic tokens beyond M3's error role
object SemanticColors {
    val SuccessLight = Color(0xFF2E7D32)
    val SuccessContainer = Color(0xFFE8F5E9)
    val WarningLight = Color(0xFFE65100)
    val WarningContainer = Color(0xFFFFF3E0)
    val InfoLight = Color(0xFF0277BD)
}

// Fintech — direction-specific colors (most common mistake):
// ✅ Green = received/credit/gain     Red = sent/debit/loss
// ❌ Green = positive balance  AND  Green for "available" (ambiguous)

// Healthtech — metric-specific colors:
// Heart rate = always red · Sleep = always indigo · Steps = always blue
// ❌ All health metrics same blue — user can't distinguish at a glance

// Edtech — answer state colors:
// Correct = green · Incorrect = red · Skipped = gray · Streak = orange
// ❌ Correct AND available both green — wrong semantic layer
```

---

## CRITICAL — Spacing

### Rule 6: 4dp Grid — All Spacing from the Scale

```kotlin
// ✅ Define once, use everywhere
object Spacing {
    val xs   = 4.dp    // icon internal padding, badge padding
    val sm   = 8.dp    // between icon and label
    val md   = 12.dp   // list item vertical padding
    val lg   = 16.dp   // screen edge, card padding (most common)
    val xl   = 24.dp   // section spacing, dialog padding
    val xxl  = 32.dp   // large section gaps
    val xxxl = 48.dp   // hero padding
}

// Standard rules:
// Screen horizontal padding: always 16.dp
// Card internal padding: 16.dp
// Between sections: 24.dp
// Between icon and text: 8.dp
// Dialog padding: 24.dp

// ❌ Arbitrary: 13.dp, 17.dp, 22.dp, 7.dp — not on the grid
// ❌ Different screen edge padding across screens (16 on A, 20 on B)
```

**Category density guide:**
- Fintech/Enterprise → dense (8-12dp vertical), maximize information
- Healthtech/Proptech → generous (16-24dp), open and calming
- Social feeds → compact (8-12dp between cards)
- Edtech → readable (16-24dp horizontal padding for text)

---

## HIGH — Elevation

### Rule 7: Tonal Elevation — Not Box Shadows

```kotlin
// ✅ M3 uses color tints for elevation, not drop shadows
Surface(tonalElevation = 3.dp)    // correct M3 elevation
Card(elevation = CardDefaults.cardElevation(defaultElevation = 1.dp))

// Elevation scale:
// 0dp = background · 1dp = cards · 3dp = hover/nav bar
// 6dp = FAB · 8dp = drawer · 12dp = modal sheets/dialogs

// Dark mode: higher elevation = lighter surface (automatic with tonalElevation)

// ❌ shadowElevation = 8.dp everywhere — Material 2 style
// ❌ Modifier.shadow() — bypasses M3 system
// ❌ Same elevation for everything — no depth hierarchy
```

---

## HIGH — Shapes

### Rule 8: Shape Scale — Consistent Personality

```kotlin
// ✅ Define app shape personality once
val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),   // chips, badges
    small      = RoundedCornerShape(8.dp),   // text fields, small buttons
    medium     = RoundedCornerShape(12.dp),  // cards (most common)
    large      = RoundedCornerShape(16.dp),  // bottom sheets, dialogs
    extraLarge = RoundedCornerShape(28.dp),  // large feature cards
)

// Bottom sheet: top corners only
ModalBottomSheet(shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))

// ❌ Arbitrary radii: 7dp, 15dp, 22dp — not in scale
// ❌ All components same radius — no shape hierarchy
// ❌ Image corner bleeds past card radius (missing clip)
```

**Category shape personalities:**
- Fintech → conservative (4-12dp), pill shapes signal unreliability in banking
- Edtech → friendly (16-20dp for course cards), pill for tags
- Healthtech → soft (20-28dp for metric cards), circles for rings
- Enterprise → minimal (4-8dp), professional density
- Social → chat bubbles need asymmetric radius (large on 3 corners, small on sender corner)

---

## HIGH — Brand Colors

### Rule 9: Integrate Brand Without Breaking System

```kotlin
// ✅ Brand color becomes the M3 primary — let M3 generate the scheme
// Use Material Theme Builder: https://m3.material.io/theme-builder
// Input your brand hex → get all 30 role values generated automatically

// Brand color contrast check (WCAG AA = 4.5:1 minimum):
// Too light brand (e.g. #58CC02): darken to #3D9B00 for text use
// Use light brand as container, dark text on it

// ❌ Brand color used for body text (primary is for interactive only)
// ❌ Brand color ignores dark mode variant
// ❌ Same brand shade for both themes — fails contrast in dark mode
// ❌ Brand overrides error color — always keep red for errors
```

---

## References

- `references/color-roles-reference.md` — Full 30-role table, component→color mapping, surface container guide. Read when choosing which role to use for a new component.
- `rules/` — 8 individual rule files with complete examples and anti-patterns for all rules above.
