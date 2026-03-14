# Use AnimatedVisibility with Explicit Enter/Exit Specs

**Impact: HIGH**

Default `AnimatedVisibility` with no enter/exit spec produces a jarring snap.
Always specify transitions. Missing `label` breaks Android Studio Animation Inspector.

## Rule

```kotlin
// ✅ Always specify enter + exit — never rely on defaults
AnimatedVisibility(
    visible = uiState.isSolving,
    enter = fadeIn(tween(300)) + slideInVertically(tween(340)) { it / 3 },
    exit  = fadeOut(tween(200)) + slideOutVertically(tween(200)) { it / 3 }
) {
    SolvingIndicatorRow()
}

// ✅ animateContentSize — smooth expand/collapse without AnimatedVisibility
var expanded by remember { mutableStateOf(false) }
Card(
    modifier = Modifier
        .fillMaxWidth()
        .animateContentSize(spring(dampingRatio = Spring.DampingRatioMediumBouncy)),
    onClick = { expanded = !expanded }
) {
    Column(modifier = Modifier.padding(16.dp)) {
        TitleRow()
        if (expanded) {
            Spacer(Modifier.height(8.dp))
            ExpandedContent()
        }
    }
}

// ✅ animateFloatAsState — always include label (required for Animation Inspector)
val rotation by animateFloatAsState(
    targetValue    = if (expanded) 180f else 0f,
    animationSpec  = tween(300),
    label          = "chevron_rotation"   // ← required, not optional
)
Icon(Icons.Default.ExpandMore, null, modifier = Modifier.rotate(rotation))

// ✅ animateColorAsState
val bgColor by animateColorAsState(
    targetValue   = if (selected) MaterialTheme.colorScheme.primaryContainer
                    else MaterialTheme.colorScheme.surface,
    animationSpec = tween(250),
    label         = "card_background"
)

// ✅ List item animations — use animateItem() with stable keys (not AnimatedVisibility)
LazyColumn {
    items(list, key = { it.id }) { item ->
        ItemRow(
            item = item,
            modifier = Modifier.animateItem(
                fadeInSpec    = tween(300),
                fadeOutSpec   = tween(300),
                placementSpec = spring(stiffness = Spring.StiffnessMediumLow)
            )
        )
    }
}
```

## AnimationSpec Cheat Sheet

```kotlin
// spring() — physics-based, no fixed duration (best for interactive UI)
spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)

// tween() — fixed duration with easing (best for opacity, color)
tween(durationMillis = 300, easing = FastOutSlowInEasing)

// snap() — instant, no animation
snap(delayMillis = 0)
```

## Anti-Patterns

```kotlin
// ❌ No enter/exit — snaps in/out
AnimatedVisibility(visible = show) { Content() }

// ❌ Missing label — breaks Animation Inspector
val alpha by animateFloatAsState(targetValue = 1f)

// ❌ Suspend call directly in composition — won't compile
val anim = remember { Animatable(0f) }
anim.animateTo(1f)  // ❌ must be inside LaunchedEffect
// ✅
LaunchedEffect(trigger) { anim.animateTo(1f) }
```
