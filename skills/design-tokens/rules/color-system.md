# Color System — Semantic Roles, Never Hardcoded Values

**Impact: CRITICAL**

Hardcoded colors break dark mode, ignore user wallpaper-based dynamic color,
and make brand updates require touching every file. Every color in a production
Android app must reference a semantic token, never a raw hex or Color() value.

## The Material 3 Color Role System

Material 3 defines 30 color roles organized into 6 families. Each family has
a primary surface color and an "on" color (text/icons on that surface).

```kotlin
// The 6 color families — each has a surface + on-surface pair
MaterialTheme.colorScheme.primary          // brand primary (buttons, FAB)
MaterialTheme.colorScheme.onPrimary        // content on primary surfaces

MaterialTheme.colorScheme.secondary        // supporting brand color
MaterialTheme.colorScheme.onSecondary

MaterialTheme.colorScheme.tertiary         // accent, contrasting highlight
MaterialTheme.colorScheme.onTertiary

MaterialTheme.colorScheme.error            // errors, destructive actions
MaterialTheme.colorScheme.onError

MaterialTheme.colorScheme.surface          // cards, sheets, dialogs
MaterialTheme.colorScheme.onSurface        // primary text on surfaces

MaterialTheme.colorScheme.background       // page background
MaterialTheme.colorScheme.onBackground     // text on background
```

## Full Color Role Reference

```kotlin
// Surface variants — for layered surfaces
MaterialTheme.colorScheme.surfaceVariant       // slightly tinted surface
MaterialTheme.colorScheme.onSurfaceVariant     // secondary text, icons
MaterialTheme.colorScheme.surfaceContainerLowest   // deepest surface
MaterialTheme.colorScheme.surfaceContainerLow
MaterialTheme.colorScheme.surfaceContainer         // default container
MaterialTheme.colorScheme.surfaceContainerHigh
MaterialTheme.colorScheme.surfaceContainerHighest  // topmost surface

// Containers — filled backgrounds for components
MaterialTheme.colorScheme.primaryContainer     // tonal button bg, chip bg
MaterialTheme.colorScheme.onPrimaryContainer   // text on primary container
MaterialTheme.colorScheme.secondaryContainer
MaterialTheme.colorScheme.onSecondaryContainer
MaterialTheme.colorScheme.tertiaryContainer
MaterialTheme.colorScheme.onTertiaryContainer
MaterialTheme.colorScheme.errorContainer
MaterialTheme.colorScheme.onErrorContainer

// Outline
MaterialTheme.colorScheme.outline             // borders, dividers
MaterialTheme.colorScheme.outlineVariant      // subtle dividers

// Inverse — for snackbars, tooltips (inverted theme)
MaterialTheme.colorScheme.inverseSurface
MaterialTheme.colorScheme.inverseOnSurface
MaterialTheme.colorScheme.inversePrimary

// Scrim — modal backgrounds
MaterialTheme.colorScheme.scrim
```

## Correct Usage Patterns

```kotlin
// ✅ Text — always use semantic roles
Text(
    text = "Account Balance",
    color = MaterialTheme.colorScheme.onSurface        // primary text
)
Text(
    text = "Last updated 2 min ago",
    color = MaterialTheme.colorScheme.onSurfaceVariant // secondary text
)

// ✅ Card background
Card(
    colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceContainerLow
    )
)

// ✅ Primary action button
Button(
    colors = ButtonDefaults.buttonColors(
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary
    )
)

// ✅ Tonal secondary button
FilledTonalButton(
    colors = ButtonDefaults.filledTonalButtonColors(
        containerColor = MaterialTheme.colorScheme.secondaryContainer,
        contentColor = MaterialTheme.colorScheme.onSecondaryContainer
    )
)

// ✅ Dividers
HorizontalDivider(
    color = MaterialTheme.colorScheme.outlineVariant
)

// ✅ Icon — secondary
Icon(
    imageVector = Icons.Default.Settings,
    tint = MaterialTheme.colorScheme.onSurfaceVariant
)
```

## Anti-Patterns

```kotlin
// ❌ Hardcoded hex — breaks dark mode completely
Text(color = Color(0xFF212121))           // black text invisible in dark mode
Box(modifier = Modifier.background(Color.White))  // white bg in dark mode
Icon(tint = Color(0xFF6200EE))            // hardcoded purple

// ❌ Color constants file with hex values
object AppColors {
    val Primary = Color(0xFF6200EE)       // ❌ bypasses M3 system
    val Background = Color(0xFFFAFAFA)    // ❌ always light, never dynamic
}

// ❌ Using primary for everything — semantic roles exist for a reason
Text(color = MaterialTheme.colorScheme.primary)  // ❌ for body text
// ✅ onSurface or onBackground for body text

// ❌ Wrong container pairing
Box(color = primaryContainer) {
    Text(color = onSurface)  // ❌ wrong pair — use onPrimaryContainer
}
```

## Color Pairing Rules — Always Use Matching On- Color

| Surface | Correct text/icon color |
|---|---|
| `primary` | `onPrimary` |
| `primaryContainer` | `onPrimaryContainer` |
| `secondary` | `onSecondary` |
| `secondaryContainer` | `onSecondaryContainer` |
| `surface` | `onSurface` (primary text) or `onSurfaceVariant` (secondary) |
| `surfaceVariant` | `onSurfaceVariant` |
| `error` | `onError` |
| `errorContainer` | `onErrorContainer` |
| `background` | `onBackground` |
