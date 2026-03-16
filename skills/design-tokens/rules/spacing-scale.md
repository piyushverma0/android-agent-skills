# Spacing Scale — 4dp Grid System

**Impact: CRITICAL**

Arbitrary spacing values (13dp, 17dp, 22dp) produce visual inconsistency
that users perceive as "something feels off" without knowing why. Every
spacing value must come from the 4dp grid. Production apps at Google, Spotify,
and Airbnb all use systematic spacing — it's what makes UIs feel intentional.

## The 4dp Grid — All Allowed Values

```kotlin
// Define once in your theme — use everywhere
object Spacing {
    val xs  = 4.dp    // icon internal padding, tight badge padding
    val sm  = 8.dp    // between icon and label, chip internal padding
    val md  = 12.dp   // list item vertical padding, small card padding
    val lg  = 16.dp   // standard content padding, card padding
    val xl  = 24.dp   // section spacing, dialog padding
    val xxl = 32.dp   // large section gaps
    val xxxl = 48.dp  // hero section padding, large vertical breathing room
    val huge = 64.dp  // top of screen hero padding on tablets
}
```

## Standard Spacing by Context

```kotlin
// ✅ Screen edge padding — always 16dp horizontal
Modifier.padding(horizontal = 16.dp)

// ✅ List item padding
Modifier.padding(horizontal = 16.dp, vertical = 12.dp)

// ✅ Card internal padding
Modifier.padding(16.dp)  // all sides

// ✅ Between icon and text label
Spacer(Modifier.width(8.dp))

// ✅ Between sections on a screen
Spacer(Modifier.height(24.dp))

// ✅ Bottom of screen before navigation bar
Modifier.padding(bottom = 16.dp)

// ✅ Dialog padding
Modifier.padding(24.dp)

// ✅ Chip internal horizontal padding
Modifier.padding(horizontal = 12.dp, vertical = 6.dp)

// ✅ FAB padding from screen edge
Modifier.padding(16.dp)  // standard
Modifier.padding(24.dp)  // extended — more breathing room
```

## App Category Spacing Conventions

```
Fintech (banking, payments):
  → Dense: 12dp vertical list items, 16dp card padding
  → Data-heavy screens can use 8dp vertical density
  → Never go below 8dp for touch targets in financial actions

Edtech (courses, learning):
  → Generous: 16-24dp section spacing, 16dp card padding
  → Reading content: 20-24dp horizontal for comfortable line width
  → Quiz screens: 16dp between options, 24dp top padding

Healthtech (fitness, medical):
  → Open: 24dp section spacing, feels spacious and calming
  → Stats cards: 16dp internal padding, 12dp gap between cards
  → Metric displays: generous padding around numbers (24dp+)

Ecommerce (shopping):
  → Product grid: 8-12dp gap between cards
  → Product detail: 16dp horizontal, 24dp between sections
  → Cart items: 16dp padding, 8dp vertical between items

Social (feeds, messaging):
  → Feed cards: 16dp horizontal, 8-12dp vertical gap between cards
  → Chat bubbles: 8dp internal, 4dp between messages, 16dp from edge
  → Stories: 8dp gap between circles

Enterprise (dashboards, tools):
  → Dense: 8-12dp row padding, maximize information density
  → Tables: 12dp cell padding horizontal, 8dp vertical
  → Sidebars: 16dp padding

Proptech (real estate):
  → Generous: large photos need breathing room, 16-24dp padding
  → Map view: minimal padding (0-8dp) to maximize map space
  → Property cards: 16dp internal padding
```

## Anti-Patterns

```kotlin
// ❌ Arbitrary values — not on the 4dp grid
Modifier.padding(13.dp)   // why 13? use 12 or 16
Modifier.padding(22.dp)   // why 22? use 20 or 24
Modifier.padding(7.dp)    // why 7? use 8
Spacer(Modifier.height(15.dp))  // why 15? use 16

// ❌ Inconsistent screen edge padding
// Screen A uses 16dp horizontal
// Screen B uses 20dp horizontal
// Screen C uses 14dp horizontal
// ← user perceives the app as inconsistent and unpolished

// ❌ No spacing between sections
Column {
    SectionA()
    // ← no spacer — sections merge visually
    SectionB()
}

// ❌ Same spacing for all contexts
// Dialog content: 8dp padding (too tight for a dialog)
// List item: 24dp padding (too loose for a dense list)
```
