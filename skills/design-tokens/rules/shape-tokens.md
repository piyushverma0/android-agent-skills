# Shape Tokens — Consistent Corner Radius System

**Impact: HIGH**

Apps where every component has a different corner radius (8dp here, 12dp there,
20dp somewhere else) feel visually incoherent. Material 3 defines a shape scale
that creates a family feeling across all components. Apps like Google Maps,
Gmail, and YouTube all use consistent shape families.

## Material 3 Shape Scale

```kotlin
// M3 defines 5 shape levels
// Extra Small → Small → Medium → Large → Extra Large → Full (circle/pill)

// In your Theme.kt
val shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),   // chips, small badges, tooltips
    small      = RoundedCornerShape(8.dp),   // text fields, small buttons
    medium     = RoundedCornerShape(12.dp),  // cards, dialogs (default for most)
    large      = RoundedCornerShape(16.dp),  // bottom sheets, navigation drawer
    extraLarge = RoundedCornerShape(28.dp),  // large cards, feature highlights
)

// Usage — always reference theme shapes, never hardcode
MaterialTheme.shapes.extraSmall  // 4dp
MaterialTheme.shapes.small       // 8dp
MaterialTheme.shapes.medium      // 12dp
MaterialTheme.shapes.large       // 16dp
MaterialTheme.shapes.extraLarge  // 28dp
```

## Component → Shape Mapping

```kotlin
// M3 specifies the correct shape for each component — use these

// Chips → ExtraSmall (4dp) or full pill
FilterChip(shape = MaterialTheme.shapes.extraSmall)

// Text fields → ExtraSmall (4dp) — only top corners rounded
OutlinedTextField(shape = MaterialTheme.shapes.extraSmall)

// Small buttons → Full (pill shape)
Button(shape = CircleShape)  // or RoundedCornerShape(50)

// Cards → Medium (12dp)
Card(shape = MaterialTheme.shapes.medium)

// Dialogs → Medium or Large (12-16dp)
AlertDialog(shape = MaterialTheme.shapes.large)

// Bottom sheets → Large top corners, flat bottom
ModalBottomSheet(shape = RoundedCornerShape(
    topStart = 28.dp,
    topEnd = 28.dp,
    bottomStart = 0.dp,
    bottomEnd = 0.dp
))

// Navigation drawer → Large (top-right and bottom-right only)
// M3 handles this automatically for NavigationDrawer

// FAB → Large (16dp) or ExtraLarge (28dp) for large FAB
FloatingActionButton(shape = MaterialTheme.shapes.large)

// Avatar/profile image → Circle (full)
Box(modifier = Modifier.clip(CircleShape))

// Image cards with content below → Top corners rounded, bottom flat
Card(shape = RoundedCornerShape(
    topStart = 12.dp, topEnd = 12.dp,
    bottomStart = 0.dp, bottomEnd = 0.dp
))
```

## App Category Shape Personalities

```
Fintech (banking, insurance):
  → Conservative: medium (12dp) for cards, small (8dp) for fields
  → Avoid pill shapes for critical actions (too playful)
  → Rectangular with small radius = trustworthy, serious

Edtech (courses, learning):
  → Friendly: large (16-20dp) for course cards
  → Pill shapes for tags and badges
  → Rounded feels approachable for learning contexts

Healthtech (fitness, wellness):
  → Soft: extraLarge (28dp) or large (20dp) for metric cards
  → Pill shapes for activity chips
  → Full circles for avatar and ring components

Ecommerce (shopping):
  → Medium (12dp) for product cards — clean and product-focused
  → Small (8dp) for price badges
  → Pill for discount/offer tags

Social (feeds, messaging):
  → Chat bubbles: large radius on 3 corners, small on sender corner
  → Story rings: full circle
  → Post cards: medium (12dp)
  → Profile image: full circle

Enterprise (B2B, dashboards):
  → Small (4-8dp) — professional, data-dense
  → Minimal rounding signals seriousness
  → Tables and data grids: 4dp or 0dp radius
```

## Anti-Patterns

```kotlin
// ❌ Arbitrary radii everywhere
Card(shape = RoundedCornerShape(7.dp))   // why 7?
Card(shape = RoundedCornerShape(15.dp))  // why 15?
Card(shape = RoundedCornerShape(20.dp))  // next card uses 20 too? consistent at least

// ❌ All components same radius — no shape hierarchy
// Everything is 8dp — chips, cards, dialogs, buttons all look the same weight

// ❌ Mismatched image and card radius
Card(shape = RoundedCornerShape(12.dp)) {
    Image(/* no clip */)  // ❌ image corners bleed outside card
    // ✅ image needs matching clip or use Card's built-in clipping
}

// ❌ Pill shape for destructive actions in fintech
Button(
    shape = CircleShape,  // ❌ too casual for "Transfer ₹50,000"
    onClick = { transferFunds() }
)
```
