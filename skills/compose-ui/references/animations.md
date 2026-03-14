# Compose Animations Reference

Full animation API for Jetpack Compose. Read this when adding any animation.

---

## 1. AnimatedVisibility — Show/Hide with Transitions

```kotlin
// Basic show/hide
AnimatedVisibility(visible = isVisible) {
    Text("Hello")
}

// Custom enter/exit
AnimatedVisibility(
    visible = uiState.isSolving,
    enter = fadeIn(tween(300)) + slideInVertically(tween(340)) { fullHeight -> fullHeight / 3 },
    exit  = fadeOut(tween(200)) + slideOutVertically(tween(200)) { it / 3 }
) {
    SolvingIndicator()
}

// Available enter transitions (can be combined with +)
fadeIn(tween(300))
slideInHorizontally { fullWidth -> -fullWidth }   // slide from left
slideInVertically   { fullHeight -> fullHeight }  // slide from bottom
scaleIn(initialScale = 0.8f)
expandIn(expandFrom = Alignment.TopCenter)
expandHorizontally()
expandVertically()

// Available exit transitions (mirror of enter)
fadeOut(tween(200))
slideOutHorizontally { fullWidth -> fullWidth }
slideOutVertically   { -it }
scaleOut(targetScale = 0.8f)
shrinkOut(shrinkTowards = Alignment.TopCenter)
shrinkHorizontally()
shrinkVertically()
```

### AnimatedVisibility inside LazyColumn

```kotlin
// ✅ Use animateItem() on the item modifier, not AnimatedVisibility for list items
LazyColumn {
    items(list, key = { it.id }) { item ->
        ItemRow(
            item = item,
            modifier = Modifier.animateItem(   // built-in list animation
                fadeInSpec  = tween(300),
                fadeOutSpec = tween(300),
                placementSpec = spring(stiffness = Spring.StiffnessMediumLow)
            )
        )
    }
}
```

---

## 2. animateXxxAsState — Single Value Animations

```kotlin
// Float
val alpha by animateFloatAsState(
    targetValue = if (enabled) 1f else 0.4f,
    animationSpec = tween(durationMillis = 200),
    label = "button_alpha"
)

// Color
val backgroundColor by animateColorAsState(
    targetValue = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
    animationSpec = tween(300),
    label = "card_bg"
)

// Dp
val elevation by animateDpAsState(
    targetValue = if (pressed) 0.dp else 4.dp,
    animationSpec = spring(stiffness = Spring.StiffnessMedium),
    label = "card_elevation"
)

// IntOffset (for position)
val offset by animateIntOffsetAsState(
    targetValue = if (expanded) IntOffset(0, 0) else IntOffset(0, 200),
    animationSpec = tween(400),
    label = "panel_offset"
)

// Usage in composable
Box(
    modifier = Modifier
        .alpha(alpha)
        .background(backgroundColor)
        .shadow(elevation)
        .offset { offset }
)
```

**Rule:** Always set `label` — required for the Animation Inspector in Android Studio Hedgehog+.

---

## 3. animateContentSize — Animate Size Changes

```kotlin
// ✅ Expand/collapse with smooth animation
var expanded by remember { mutableStateOf(false) }

Card(
    modifier = Modifier
        .fillMaxWidth()
        .animateContentSize(
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness    = Spring.StiffnessLow
            )
        ),
    onClick = { expanded = !expanded }
) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = title, style = MaterialTheme.typography.titleMedium)
        if (expanded) {
            Spacer(Modifier.height(8.dp))
            Text(text = body, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
```

---

## 4. Crossfade — Swap Between Composables

```kotlin
// Animate between different content based on a state
Crossfade(
    targetState = currentScreen,
    animationSpec = tween(400),
    label = "screen_crossfade"
) { screen ->
    when (screen) {
        Screen.Loading -> LoadingScreen()
        Screen.Content -> ContentScreen()
        Screen.Error   -> ErrorScreen()
    }
}

// ✅ Good for tab switching, state-based content swaps
// ❌ Not for show/hide — use AnimatedVisibility instead
```

---

## 5. updateTransition — Coordinated Multi-Property Animations

Use when multiple properties animate together in response to the same state change.

```kotlin
enum class CardState { Collapsed, Expanded }

@Composable
fun AnimatedCard(isExpanded: Boolean) {
    val state = if (isExpanded) CardState.Expanded else CardState.Collapsed
    val transition = updateTransition(targetState = state, label = "card_transition")

    val elevation by transition.animateDp(
        transitionSpec = { spring(stiffness = Spring.StiffnessMedium) },
        label = "elevation"
    ) { cardState -> if (cardState == CardState.Expanded) 8.dp else 2.dp }

    val backgroundColor by transition.animateColor(
        transitionSpec = { tween(300) },
        label = "bg_color"
    ) { cardState ->
        if (cardState == CardState.Expanded) MaterialTheme.colorScheme.primaryContainer
        else MaterialTheme.colorScheme.surface
    }

    val cornerRadius by transition.animateDp(
        transitionSpec = { tween(300) },
        label = "corner_radius"
    ) { cardState -> if (cardState == CardState.Expanded) 0.dp else 16.dp }

    Card(
        modifier = Modifier.shadow(elevation, RoundedCornerShape(cornerRadius)),
        colors = CardDefaults.cardColors(containerColor = backgroundColor)
    ) { ... }
}
```

---

## 6. rememberInfiniteTransition — Looping Animations

```kotlin
// Loading shimmer / pulse effect
val infiniteTransition = rememberInfiniteTransition(label = "loading_shimmer")

val shimmerAlpha by infiniteTransition.animateFloat(
    initialValue = 0.3f,
    targetValue  = 1f,
    animationSpec = infiniteRepeatable(
        animation  = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        repeatMode = RepeatMode.Reverse
    ),
    label = "shimmer_alpha"
)

val pulseScale by infiniteTransition.animateFloat(
    initialValue = 1f,
    targetValue  = 1.1f,
    animationSpec = infiniteRepeatable(
        animation  = tween(600, easing = FastOutSlowInEasing),
        repeatMode = RepeatMode.Reverse
    ),
    label = "pulse_scale"
)

// Usage
Box(
    modifier = Modifier
        .alpha(shimmerAlpha)
        .scale(pulseScale)
        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
        .size(200.dp, 20.dp)
)
```

---

## 7. Animatable — Imperative / Manual Control

Use when you need to `animateTo()` from an event handler or coroutine.

```kotlin
@Composable
fun ShakeableTextField(onError: Boolean) {
    val offsetX = remember { Animatable(0f) }

    LaunchedEffect(onError) {
        if (onError) {
            // Shake animation
            repeat(4) {
                offsetX.animateTo( 10f, spring(stiffness = Spring.StiffnessHigh))
                offsetX.animateTo(-10f, spring(stiffness = Spring.StiffnessHigh))
            }
            offsetX.animateTo(0f)
        }
    }

    TextField(
        value = "",
        onValueChange = {},
        modifier = Modifier.offset { IntOffset(offsetX.value.roundToInt(), 0) }
    )
}
```

---

## 8. AnimatedContent — Animate Content Changes with Size

```kotlin
AnimatedContent(
    targetState = uiState.count,
    transitionSpec = {
        // Slide up when count increases, slide down when decreases
        if (targetState > initialState) {
            slideInVertically { -it } + fadeIn() togetherWith slideOutVertically { it } + fadeOut()
        } else {
            slideInVertically { it } + fadeIn() togetherWith slideOutVertically { -it } + fadeOut()
        }.using(SizeTransform(clip = false))
    },
    label = "count_animation"
) { count ->
    Text(
        text = "$count",
        style = MaterialTheme.typography.headlineLarge,
        fontVariant = FontVariant.TABULAR  // keeps number width stable during animation
    )
}
```

---

## 9. Shared Element Transitions (Compose 1.7+ / BOM 2024.x)

```kotlin
// In list screen
@Composable
fun QuestionListItem(question: Question, onClick: () -> Unit) {
    val sharedTransitionScope = LocalSharedTransitionScope.current
        ?: return  // not inside SharedTransitionLayout

    with(sharedTransitionScope) {
        Card(
            onClick = onClick,
            modifier = Modifier.sharedElement(
                state = rememberSharedContentState(key = "card_${question.id}"),
                animatedVisibilityScope = LocalAnimatedVisibilityScope.current!!
            )
        ) {
            Text(
                text = question.title,
                modifier = Modifier.sharedElement(
                    state = rememberSharedContentState(key = "title_${question.id}"),
                    animatedVisibilityScope = LocalAnimatedVisibilityScope.current!!
                )
            )
        }
    }
}

// Wrap NavHost with SharedTransitionLayout
SharedTransitionLayout {
    CompositionLocalProvider(LocalSharedTransitionScope provides this) {
        NavHost(navController, startDestination = "list") {
            composable("list") { QuestionListScreen() }
            composable("detail/{id}") { QuestionDetailScreen() }
        }
    }
}
```

---

## 10. AnimationSpec — Choosing the Right One

```kotlin
// spring() — natural physics-based, no fixed duration (PREFERRED for UI interactions)
spring(
    dampingRatio = Spring.DampingRatioMediumBouncy,  // bouncy feel
    stiffness    = Spring.StiffnessMedium             // speed
)
// DampingRatio: NoBouncy (1f) → LowBouncy → MediumBouncy → HighBouncy (0.2f)
// Stiffness: VeryLow → Low → Medium → MediumLow → High → VeryHigh

// tween() — fixed duration, easing curve (good for opacity, color)
tween(
    durationMillis = 300,
    easing = FastOutSlowInEasing    // Material Motion standard
)
// Easing options: LinearEasing, FastOutSlowInEasing, LinearOutSlowInEasing, FastOutLinearInEasing

// keyframes() — multi-step animation with specific values at specific times
keyframes {
    durationMillis = 500
    0f   at 0   using LinearEasing
    0.8f at 300 using FastOutSlowInEasing
    1f   at 500
}

// snap() — instant change, no animation
snap(delayMillis = 0)
```

---

## Common Mistakes

```kotlin
// ❌ Missing label on animate*AsState — breaks Animation Inspector
val alpha by animateFloatAsState(targetValue = 1f)
// ✅
val alpha by animateFloatAsState(targetValue = 1f, label = "button_alpha")

// ❌ Creating Animatable inside items{} — new instance on every recompose
items(list) { item ->
    val anim = remember { Animatable(0f) }  // ✅ actually fine with remember
    // ❌ but without remember:
    val anim2 = Animatable(0f)  // new instance every recompose, animation lost
}

// ❌ Using animate*AsState for looping animation
val alpha by animateFloatAsState(if (loading) 1f else 0f)  // not looping
// ✅ Use rememberInfiniteTransition for loops

// ❌ Animating inside composition without LaunchedEffect
@Composable fun Wrong() {
    val anim = remember { Animatable(0f) }
    anim.animateTo(1f)  // ❌ suspend call in composition — won't compile
}
// ✅
LaunchedEffect(Unit) { anim.animateTo(1f) }
```
