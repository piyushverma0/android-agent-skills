---
name: compose-animation
description: |
  Jetpack Compose animations for Android AI agents. Use this skill whenever adding
  animations to Compose UIs: AnimatedVisibility, AnimatedContent, Crossfade, animate*AsState,
  animateColorAsState, animateDpAsState, animateFloatAsState, transition, updateTransition,
  InfiniteTransition, rememberInfiniteTransition, spring, tween, keyframes, snap,
  animateItemPlacement, LazyList animations, shared element transitions, predictive back,
  shimmer loading, skeleton screens, or any motion/animation in Compose. Also applies to
  page transitions, loading animations, and micro-interactions.
---

# Compose Animation

Motion makes apps feel alive and professional. These rules cover the full animation toolkit.

## Rule 1: AnimatedVisibility — show/hide with animation

```kotlin
// ✅ Animate visibility with correct enter/exit
AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn(tween(200)) + slideInVertically(
        initialOffsetY = { -it },
        animationSpec = tween(200, easing = EaseOut)
    ),
    exit = fadeOut(tween(150)) + slideOutVertically(
        targetOffsetY = { -it },
        animationSpec = tween(150, easing = EaseIn)
    )
) {
    BannerContent()
}

// ✅ Common combination patterns
// Slide from bottom (bottom sheet-like)
enter = slideInVertically(initialOffsetY = { it }) + fadeIn()
exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()

// Expand/collapse
enter = expandVertically() + fadeIn()
exit = shrinkVertically() + fadeOut()

// Scale pop
enter = scaleIn(initialScale = 0.85f) + fadeIn()
exit = scaleOut(targetScale = 0.85f) + fadeOut()
```

## Rule 2: AnimatedContent — animate between different content

```kotlin
// ✅ Animate UI state transitions
AnimatedContent(
    targetState = uiState,
    transitionSpec = {
        fadeIn(tween(200)) togetherWith fadeOut(tween(150))
    },
    contentKey = { it::class }  // key by type, not value
) { state ->
    when (state) {
        is UiState.Loading -> LoadingContent()
        is UiState.Success -> SuccessContent(state.data)
        is UiState.Error -> ErrorContent(state.message)
        is UiState.Empty -> EmptyContent()
    }
}

// ✅ Count/number animation
AnimatedContent(
    targetState = count,
    transitionSpec = {
        if (targetState > initialState) {
            // counting up — slide new number in from bottom
            slideInVertically { height -> height } + fadeIn() togetherWith
                slideOutVertically { height -> -height } + fadeOut()
        } else {
            // counting down — slide new number in from top
            slideInVertically { height -> -height } + fadeIn() togetherWith
                slideOutVertically { height -> height } + fadeOut()
        }.using(SizeTransform(clip = false))
    }
) { count ->
    Text(text = "$count", style = MaterialTheme.typography.displayLarge)
}
```

## Rule 3: animate*AsState — smooth value transitions

```kotlin
// ✅ Animate a single value
val elevation by animateDpAsState(
    targetValue = if (isPressed) 0.dp else 4.dp,
    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
    label = "cardElevation"
)

val alpha by animateFloatAsState(
    targetValue = if (isEnabled) 1f else 0.38f,
    animationSpec = tween(200),
    label = "alpha"
)

val backgroundColor by animateColorAsState(
    targetValue = if (isSelected) MaterialTheme.colorScheme.primaryContainer
                  else MaterialTheme.colorScheme.surface,
    animationSpec = tween(200),
    label = "backgroundColor"
)

// ✅ Use in Composable
Surface(
    modifier = Modifier
        .graphicsLayer { this.alpha = alpha }
        .shadow(elevation = elevation, shape = shape),
    color = backgroundColor
) { ... }
```

## Rule 4: updateTransition — coordinate multiple value animations

```kotlin
// ✅ Multiple values animated in sync via transition
enum class ButtonState { Idle, Loading, Success, Error }

@Composable
fun AnimatedButton(state: ButtonState, onClick: () -> Unit) {
    val transition = updateTransition(targetState = state, label = "buttonState")

    val backgroundColor by transition.animateColor(label = "bgColor") { buttonState ->
        when (buttonState) {
            ButtonState.Idle -> MaterialTheme.colorScheme.primary
            ButtonState.Loading -> MaterialTheme.colorScheme.primaryContainer
            ButtonState.Success -> MaterialTheme.colorScheme.tertiary
            ButtonState.Error -> MaterialTheme.colorScheme.errorContainer
        }
    }

    val contentAlpha by transition.animateFloat(label = "contentAlpha") { buttonState ->
        if (buttonState == ButtonState.Loading) 0f else 1f
    }

    val scale by transition.animateFloat(
        transitionSpec = { spring(dampingRatio = Spring.DampingRatioMediumBouncy) },
        label = "scale"
    ) { if (it == ButtonState.Success) 1.05f else 1f }

    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = backgroundColor),
        modifier = Modifier.scale(scale)
    ) {
        Box {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp).align(Alignment.Center),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp,
                alpha = 1f - contentAlpha
            )
            Text(
                text = when (state) {
                    ButtonState.Idle -> "Submit"
                    ButtonState.Loading -> "Loading..."
                    ButtonState.Success -> "Done!"
                    ButtonState.Error -> "Retry"
                },
                modifier = Modifier.alpha(contentAlpha)
            )
        }
    }
}
```

## Rule 5: InfiniteTransition — loading animations, pulses

```kotlin
// ✅ Shimmer loading animation
@Composable
fun ShimmerBox(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val shimmerAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmerAlpha"
    )

    Box(
        modifier = modifier
            .clip(MaterialTheme.shapes.small)
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = shimmerAlpha))
    )
}

// ✅ Pulsing badge
@Composable
fun PulsingDot(color: Color = MaterialTheme.colorScheme.primary) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )
    Box(
        modifier = Modifier
            .size(10.dp)
            .scale(scale)
            .clip(CircleShape)
            .background(color)
    )
}
```

## Rule 6: LazyList item animations

```kotlin
// ✅ Animate item placement in LazyColumn
LazyColumn {
    items(items, key = { it.id }) { item ->
        ItemCard(
            item = item,
            modifier = Modifier.animateItem(         // auto-animates add/remove/reorder
                fadeInSpec = tween(200),
                fadeOutSpec = tween(200),
                placementSpec = spring(stiffness = Spring.StiffnessMediumLow)
            )
        )
    }
}
```

## Rule 7: Skeleton loading screens

```kotlin
// ✅ Skeleton that matches real content shape
@Composable
fun ItemCardSkeleton() {
    AppCard {
        Row(modifier = Modifier.padding(Spacing.md)) {
            // Avatar skeleton
            ShimmerBox(modifier = Modifier.size(48.dp).clip(CircleShape))
            Spacer(modifier = Modifier.width(Spacing.sm))
            Column(modifier = Modifier.weight(1f)) {
                // Title skeleton
                ShimmerBox(modifier = Modifier.fillMaxWidth(0.7f).height(16.dp))
                Spacer(modifier = Modifier.height(Spacing.xs))
                // Subtitle skeleton
                ShimmerBox(modifier = Modifier.fillMaxWidth(0.5f).height(12.dp))
            }
        }
    }
}

// ✅ Show skeleton during loading
when (uiState) {
    is UiState.Loading -> {
        LazyColumn {
            items(5) { ItemCardSkeleton() }  // 5 skeleton placeholders
        }
    }
    is UiState.Success -> { ... }
}
```

## Rule 8: Animation specs — choose the right one

```kotlin
// spring — natural physical feel, no fixed duration
spring(
    dampingRatio = Spring.DampingRatioMediumBouncy,  // bouncy
    stiffness = Spring.StiffnessMedium
)

// tween — precise timing, easing curve
tween(
    durationMillis = 300,
    easing = FastOutSlowInEasing  // Material motion easing
)

// keyframes — precise control at specific moments
keyframes {
    durationMillis = 500
    0f at 0 with FastOutLinearInEasing
    1.2f at 300                              // overshoot
    1f at 500 with LinearOutSlowInEasing
}

// snap — instant, no animation
snap()

// Guide: spring for interactions (button press, selection)
//        tween for content transitions (screen change, appear/disappear)
//        keyframes for branded animations with specific feel
```

## Rule 9: Predictive Back animation

```kotlin
// ✅ Enable predictive back for Android 14+
// build.gradle.kts
android {
    defaultConfig {
        manifestPlaceholders["enablePredictiveBack"] = true
    }
}

// The NavHost handles this automatically when using Navigation Compose 2.8+
// Just ensure your NavHost uses animateComposableTransitions (default)

// ✅ Custom back handler with animation
BackHandler {
    // Exit with animation before popping
    scope.launch {
        exitAnimation.animateTo(0f)
        navController.navigateUp()
    }
}
```

## Common Mistakes

❌ `visibility = if (x) Visibility.Visible else Visibility.Gone` — use AnimatedVisibility
❌ Animating without `label` param — hard to debug in Android Studio
❌ Using `delay()` instead of `animationSpec` offsets — causes jank
❌ Blocking the main thread before animation — always launch animation from coroutine
❌ Missing `contentKey` in AnimatedContent — reuses wrong composable on state change
❌ No loading skeleton — show ShimmerBox matching content layout
❌ Infinite animations without `LocalReduceMotion` check

```kotlin
// ✅ Respect system reduce motion setting
val reducedMotion = LocalAccessibilityManager.current?.isEnabled == true
val animSpec = if (reducedMotion) snap() else tween(300)
```
