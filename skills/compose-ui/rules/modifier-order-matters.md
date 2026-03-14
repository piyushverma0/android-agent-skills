# Modifier Order Determines Visual and Interaction Behavior

**Impact: HIGH**

Modifiers are applied sequentially. Swapping `padding` and `background` produces
different visual output. Swapping `clickable` and `padding` changes the touch target size.

## Rules

### padding + background order

```kotlin
// padding AFTER background → padding is INSIDE the colored area
// Result: color fills the full bounds, padding creates space inside it
Box(modifier = Modifier
    .background(Color.Red)
    .padding(16.dp)    // ← content has 16dp inset from the red background
)

// padding BEFORE background → padding is OUTSIDE the colored area
// Result: 16dp transparent space, then the red background starts
Box(modifier = Modifier
    .padding(16.dp)
    .background(Color.Red)  // ← background starts after the padding
)
```

### clickable + padding order (touch target size)

```kotlin
// clickable BEFORE padding → LARGER touch target (padding area is also tappable)
Modifier
    .clickable { onClick() }
    .padding(16.dp)          // padding inside the clickable zone

// clickable AFTER padding → SMALLER touch target (only visual content is tappable)
Modifier
    .padding(16.dp)
    .clickable { onClick() } // clickable zone starts after padding
```

### Always meet 48dp minimum touch target

```kotlin
// ✅ Small icon with guaranteed 48dp touch area
IconButton(
    onClick = onClick,
    modifier = Modifier.size(48.dp)  // guarantees minimum touch target
) {
    Icon(
        imageVector = Icons.Default.Close,
        contentDescription = "Close",
        modifier = Modifier.size(24.dp)  // visual size is smaller
    )
}
```

### modifier parameter convention

```kotlin
// ✅ Always add modifier: Modifier = Modifier to every public composable
// Always as the last parameter. Always defaulted to Modifier.
@Composable
fun QuestionCard(
    question: Question,
    onClick: () -> Unit,
    modifier: Modifier = Modifier   // ← last, defaulted
) {
    Card(modifier = modifier.fillMaxWidth()) {
        // content
    }
}

// ❌ Never apply fillMaxWidth() or other sizing inside the composable's default modifier
// The caller should decide the size
@Composable
fun WrongCard(modifier: Modifier = Modifier.fillMaxWidth()) { ... }  // ❌ limits reuse
```

## Size Modifier Reference

```kotlin
Modifier.fillMaxSize()              // fills parent width AND height
Modifier.fillMaxWidth()             // fills parent width — use on Column children
Modifier.fillMaxHeight()            // fills parent height
Modifier.weight(1f)                 // proportional size in Row/Column — preferred over fixed dp
Modifier.requiredSize(48.dp)        // ignores parent constraints
Modifier.defaultMinSize(48.dp)      // minimum without forcing exact size
Modifier.wrapContentSize()          // wraps content (this is the default)
```
