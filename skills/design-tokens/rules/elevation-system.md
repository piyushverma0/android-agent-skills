# Elevation System — Surfaces, Shadows, and Tonal Overlays

**Impact: HIGH**

Material 3 replaces drop shadows with tonal color overlays for elevation.
Using box shadows everywhere or ignoring elevation entirely produces flat UIs
that lack depth hierarchy. Users can't tell what's interactive, what's a modal,
and what's background content.

## Material 3 Elevation Levels

```kotlin
// M3 defines 6 elevation levels — each adds a tonal color overlay in light mode
// and increases the surface lightness in dark mode

0.dp   // background, page surface — no overlay
1.dp   // cards at rest — subtle tonal overlay
3.dp   // cards on hover/focus — slightly more prominent
6.dp   // navigation bar, floating elements
8.dp   // drawers, side sheets
12.dp  // modal bottom sheets
16.dp  // navigation drawer, full modal dialogs

// Use ElevationDefaults for standard components
```

## Applying Elevation Correctly

```kotlin
// ✅ Card with correct elevation
Card(
    elevation = CardDefaults.cardElevation(
        defaultElevation = 1.dp,      // at rest — subtle
        pressedElevation = 0.dp,      // pressed — flatten
        focusedElevation = 1.dp,
        hoveredElevation = 3.dp       // hover — rise slightly
    )
) { }

// ✅ Surface with elevation
Surface(
    tonalElevation = 3.dp,  // adds tonal color — correct M3 approach
    shadowElevation = 0.dp  // no drop shadow needed in M3
) { }

// ✅ Bottom sheet — elevated above everything
ModalBottomSheet(
    // M3 BottomSheet uses elevation = 1.dp for drag handle area
    // Content surface uses surfaceContainerLow automatically
) { }

// ✅ App bar — elevated when content scrolls under it
TopAppBar(
    scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior(),
    colors = TopAppBarDefaults.topAppBarColors(
        scrolledContainerColor = MaterialTheme.colorScheme.surfaceContainerHighest
    )
    // M3 changes background color on scroll instead of adding shadow
)

// ✅ Navigation bar — slight elevation over content
NavigationBar(
    tonalElevation = 3.dp
) { }

// ✅ FAB — highest elevation, always visible
FloatingActionButton(
    elevation = FloatingActionButtonDefaults.elevation(
        defaultElevation = 6.dp,
        pressedElevation = 6.dp,
        focusedElevation = 8.dp,
        hoveredElevation = 8.dp
    )
) { }
```

## Dark Mode Elevation — Tonal Overlays Lighten Surfaces

```kotlin
// In dark mode, M3 automatically applies white tonal overlay to elevated surfaces
// Higher elevation = lighter surface color in dark mode
// This is how users perceive depth without visible shadows on dark backgrounds

// The overlay percentages by elevation:
// 0dp  → 0%   overlay (pure surface color)
// 1dp  → 5%   overlay
// 3dp  → 8%   overlay
// 6dp  → 11%  overlay
// 8dp  → 12%  overlay
// 12dp → 14%  overlay

// You do NOT implement this manually — M3 Surface/Card components do it automatically
// when you set tonalElevation

// ✅ Just set tonalElevation and dark mode works automatically
Surface(tonalElevation = 6.dp) {
    // In light mode: slight primary color tint
    // In dark mode: slightly lighter than base surface
}
```

## Elevation Hierarchy — What Goes at What Level

```
Page background          → 0dp  (background color)
Content cards at rest    → 1dp  (subtle lift)
List items/rows          → 0dp  (flat, part of surface)
Selected/focused card    → 3dp  (more prominent)
Bottom navigation bar    → 3dp
Top app bar (scrolled)   → changes color, not shadow
Floating action button   → 6dp
Side navigation drawer   → 8dp  (slides over content)
Modal bottom sheets      → 12dp (highest — user focus)
Full-screen dialogs      → 12dp
Tooltips                 → 8dp
Dropdown menus           → 8dp
```

## Anti-Patterns

```kotlin
// ❌ Using shadowElevation with large values — not M3 style
Surface(shadowElevation = 8.dp)   // ❌ heavy drop shadow is Material 2 style

// ❌ Same elevation for everything
Card(elevation = CardDefaults.cardElevation(defaultElevation = 4.dp))  // everywhere
// Different contexts need different elevations to show hierarchy

// ❌ Custom box shadow via Modifier
Modifier.shadow(elevation = 8.dp, shape = RoundedCornerShape(8.dp))
// ❌ Use tonalElevation on Surface/Card instead

// ❌ No elevation distinction between background and cards
// Background: white, Cards: also white with no elevation
// → no visual depth, cards blend into background
// ✅ Cards should be surfaceContainerLow (1dp tonal) on surfaceContainer background
```
