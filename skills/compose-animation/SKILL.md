---
name: compose-animation
description: |
  Jetpack Compose animations for Android AI agents — M3 Expressive motion system. Use this
  skill for any animation: AnimatedVisibility, AnimatedContent, Crossfade, animate*AsState,
  animateColorAsState, animateDpAsState, animateFloatAsState, updateTransition, InfiniteTransition,
  rememberInfiniteTransition, spring physics, tween, keyframes, snap, M3 Expressive motion tokens,
  MotionScheme, animateItemPlacement, LazyList item animations, shared element transitions,
  SharedTransitionLayout, predictive back animation, shimmer loading skeleton screens,
  morphing shapes, gesture-driven animation, or any motion in Compose. Always apply when
  adding any animation — M3 Expressive replaced fixed easing curves with physics-based springs.
---

# Compose Animation — M3 Expressive Motion System

M3 Expressive (2025) replaced fixed-duration easing with physics-based springs.
These rules cover the complete animation toolkit — from micro-interactions to screen transitions.

## The M3 Expressive motion philosophy

```kotlin
// M3 Expressive motion tokens — import from design-system skill's DesignTokens.kt

// Physics-based springs for SPATIAL motion (position, size, scale)
// → Never use tween() for elements that move — spring feels natural
val spatialEnter = spring<Float>(
    dampingRatio = Spring.DampingRatioLowBouncy,   // slight bounce
    stiffness    = Spring.StiffnessMediumLow        // smooth, not jerky
)

// Tween with M3 easing for EFFECTS (opacity, color, blur)
// → Effects have no mass — tween with easing curve is correct
val effectsIn  = tween<Float>(Duration.medium2, easing = AppEasing.EmphasizedDecel)
val effectsOut = tween<Float>(Duration.short4,  easing = AppEasing.EmphasizedAccel)

// Rule: if it moves → spring. If it fades/colors → tween with M3 easing.
```

## Rule 1: AnimatedVisibility — M3 Expressive enter/exit

```kotlin
// ✅ Standard show/hide with M3 Expressive physics
AnimatedVisibility(
    visible = isVisible,
    enter = slideInVertically(
        initialOffsetY = { -it / 4 },
        animationSpec  = spring(Spring.DampingRatioLowBouncy, Spring.StiffnessMediumLow)
    ) + fadeIn(tween(Duration.medium2, easing = AppEasing.EmphasizedDecel)),
    exit = slideOutVertically(
        targetOffsetY = { -it / 4 },
        animationSpec = tween(Duration.short4, easing = AppEasing.EmphasizedAccel)
    ) + fadeOut(tween(Duration.short4))
) { Content() }

// ✅ Common patterns
// Slide from bottom (FAB, snackbar, floating panels)
val enterFromBottom = slideInVertically(
    initialOffsetY = { it },
    animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMedium)
) + fadeIn(tween(Duration.medium2))
val exitToBottom = slideOutVertically(
    targetOffsetY = { it },
    animationSpec = tween(Duration.short4, easing = AppEasing.EmphasizedAccel)
) + fadeOut(tween(Duration.short4))

// Scale pop (context menus, badges, chips)
val popIn  = scaleIn(initialScale = 0.7f,
    animationSpec = spring(Spring.DampingRatioLowBouncy, Spring.StiffnessHigh)
) + fadeIn(tween(Duration.short4))
val popOut = scaleOut(targetScale = 0.7f,
    animationSpec = tween(Duration.short3, easing = AppEasing.EmphasizedAccel)
) + fadeOut(tween(Duration.short3))

// Expand/collapse (accordion, show more)
val expandDown = expandVertically(
    expandFrom    = Alignment.Top,
    animationSpec = spring(Spring.DampingRatioNoBouncy, Spring.StiffnessMediumLow)
) + fadeIn(tween(Duration.medium1))
val collapseUp = shrinkVertically(
    shrinkTowards = Alignment.Top,
    animationSpec = tween(Duration.short4, easing = AppEasing.EmphasizedAccel)
) + fadeOut(tween(Duration.short4))
```

## Rule 2: AnimatedContent — state transitions with correct content key

```kotlin
// ✅ Animate entire UI state transitions
AnimatedContent(
    targetState = uiState,
    contentKey  = { it::class },    // key by STATE TYPE, not value — prevents wrong composable reuse
    transitionSpec = {
        (slideInVertically(
            initialOffsetY = { it / 4 },
            animationSpec  = spring(Spring.DampingRatioLowBouncy, Spring.StiffnessMediumLow)
        ) + fadeIn(tween(Duration.medium2, easing = AppEasing.EmphasizedDecel)))
            .togetherWith(
                slideOutVertically(
                    targetOffsetY = { -it / 4 },
                    animationSpec = tween(Duration.short4, easing = AppEasing.EmphasizedAccel)
                ) + fadeOut(tween(Duration.short4))
            )
    },
    label = "uiStateTransition"
) { state ->
    when (state) {
        is Loading -> AppLoadingScreen()
        is Success -> SuccessContent(state.data)
        is Error   -> AppErrorScreen(state.message)
        is Empty   -> AppEmptyScreen("No items", "Add your first item")
    }
}

// ✅ Counter animation (number changes)
AnimatedContent(
    targetState = count,
    transitionSpec = {
        val dir = if (targetState > initialState) 1 else -1
        (slideInVertically { it * dir } + fadeIn()).togetherWith(
            slideOutVertically { -it * dir } + fadeOut()
        ).using(SizeTransform(clip = false))
    },
    label = "counter"
) { n -> Text("$n", style = MaterialTheme.typography.displayMedium) }
```

## Rule 3: animate*AsState — smooth value transitions

```kotlin
// ✅ Spatial values → spring
val elevation by animateDpAsState(
    targetValue = if (isDragging) 8.dp else 0.dp,
    animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMedium),
    label = "cardElevation"
)
val offsetX by animateDpAsState(
    targetValue = if (isSwipedRight) 300.dp else 0.dp,
    animationSpec = spring(Spring.DampingRatioLowBouncy, Spring.StiffnessMediumLow),
    label = "swipeOffset"
)

// ✅ Effects → tween with M3 easing
val alpha by animateFloatAsState(
    targetValue   = if (isEnabled) 1f else 0.38f,
    animationSpec = tween(Duration.short4, easing = AppEasing.Standard),
    label = "alpha"
)
val backgroundColor by animateColorAsState(
    targetValue   = if (isSelected) MaterialTheme.colorScheme.primaryContainer
                    else MaterialTheme.colorScheme.surface,
    animationSpec = tween(Duration.medium1, easing = AppEasing.Standard),
    label = "bgColor"
)

// ✅ Apply in Modifier
Card(
    modifier = Modifier
        .graphicsLayer { this.alpha = alpha }
        .offset(x = offsetX),
    colors = CardDefaults.cardColors(containerColor = backgroundColor),
    elevation = CardDefaults.cardElevation(defaultElevation = elevation)
) { /* ... */ }
```

## Rule 4: updateTransition — synchronized multi-value animation

```kotlin
// ✅ Multiple values in sync — all animate together on state change
enum class ButtonState { Idle, Loading, Success, Error }

@Composable
fun StatefulButton(state: ButtonState, onClick: () -> Unit) {
    val transition = updateTransition(targetState = state, label = "buttonState")

    val containerColor by transition.animateColor(
        transitionSpec = { tween(Duration.medium2, easing = AppEasing.Standard) },
        label = "containerColor"
    ) { s -> when (s) {
        ButtonState.Idle    -> MaterialTheme.colorScheme.primary
        ButtonState.Loading -> MaterialTheme.colorScheme.primaryContainer
        ButtonState.Success -> MaterialTheme.colorScheme.tertiaryContainer
        ButtonState.Error   -> MaterialTheme.colorScheme.errorContainer
    } }

    val scale by transition.animateFloat(
        transitionSpec = { spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessHigh) },
        label = "scale"
    ) { s -> if (s == ButtonState.Success) 1.06f else 1f }

    val contentAlpha by transition.animateFloat(
        transitionSpec = { tween(Duration.short4) },
        label = "contentAlpha"
    ) { s -> if (s == ButtonState.Loading) 0f else 1f }

    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = containerColor),
        modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale }
    ) {
        Box(contentAlignment = Alignment.Center) {
            CircularProgressIndicator(
                Modifier.size(20.dp).alpha(1f - contentAlpha),
                strokeWidth = 2.dp, color = LocalContentColor.current
            )
            Text(
                text = when (state) {
                    ButtonState.Idle    -> "Submit"
                    ButtonState.Loading -> "Loading"
                    ButtonState.Success -> "Done!"
                    ButtonState.Error   -> "Retry"
                },
                modifier = Modifier.alpha(contentAlpha)
            )
        }
    }
}
```

## Rule 5: InfiniteTransition — shimmer and pulse

```kotlin
// ✅ Shimmer skeleton — matches real content shape
@Composable
fun ShimmerEffect(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue  = 0.55f,
        animationSpec = infiniteRepeatable(
            animation  = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmerAlpha"
    )
    Box(modifier.clip(MaterialTheme.shapes.small)
        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = alpha)))
}

// ✅ Skeleton that mirrors real card layout
@Composable
fun ItemCardSkeleton() {
    AppCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ShimmerEffect(Modifier.size(56.dp).clip(MaterialTheme.shapes.small))
            Spacer(Modifier.width(Spacing.md))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                ShimmerEffect(Modifier.fillMaxWidth(0.75f).height(16.dp))
                ShimmerEffect(Modifier.fillMaxWidth(0.5f).height(12.dp))
            }
        }
    }
}

// ✅ Show skeleton grid during loading
when (uiState) {
    is Loading -> LazyVerticalGrid(columns = GridCells.Adaptive(180.dp)) {
        items(6) { ItemCardSkeleton() }   // 6 skeleton placeholders
    }
    is Success -> ItemGrid(uiState.items)
    else -> { /* ... */ }
}

// ✅ Pulsing online indicator
@Composable
fun OnlineDot(color: Color = MaterialTheme.colorScheme.primary) {
    val inf = rememberInfiniteTransition(label = "pulse")
    val scale by inf.animateFloat(
        1f, 1.4f, infiniteRepeatable(tween(700, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulseScale"
    )
    Box(Modifier.size(10.dp).scale(scale).clip(CircleShape).background(color))
}
```

## Rule 6: LazyList item animations — animateItem

```kotlin
// ✅ Automatic add/remove/reorder animations in LazyColumn
LazyColumn {
    items(items, key = { it.id }) { item ->
        SwipeToDeleteCard(
            item = item,
            modifier = Modifier.animateItem(
                fadeInSpec   = tween(Duration.medium2, easing = AppEasing.EmphasizedDecel),
                fadeOutSpec  = tween(Duration.short4,  easing = AppEasing.EmphasizedAccel),
                placementSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow)
            )
        )
    }
}
```

## Rule 7: Gesture-driven animation — swipe interactions

```kotlin
// ✅ Swipe to delete with spring snap-back
@Composable
fun SwipeToDeleteCard(item: Item, onDelete: (String) -> Unit) {
    var offsetX by remember { mutableStateOf(0f) }
    val animatedOffset by animateFloatAsState(
        targetValue   = offsetX,
        animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMedium),
        label = "swipeOffset"
    )
    val deleteThreshold = -300f

    Box(
        Modifier.pointerInput(item.id) {
            detectHorizontalDragGestures(
                onDragEnd = {
                    if (offsetX < deleteThreshold) onDelete(item.id)
                    else offsetX = 0f   // spring back
                },
                onHorizontalDrag = { _, dragAmount ->
                    offsetX = (offsetX + dragAmount).coerceIn(deleteThreshold * 1.2f, 0f)
                }
            )
        }
    ) {
        // Delete background
        Box(Modifier.fillMaxSize()
            .alpha((-animatedOffset / (-deleteThreshold)).coerceIn(0f, 1f))
            .background(MaterialTheme.colorScheme.errorContainer),
            Alignment.CenterEnd) {
            Icon(Icons.Default.Delete, "Delete",
                tint = MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier.padding(end = Spacing.lg))
        }
        // Card content
        AppCard(modifier = Modifier.offset { IntOffset(animatedOffset.roundToInt(), 0) }) {
            Text(item.title)
        }
    }
}
```

## Rule 8: Animation specs — choosing the right one

```kotlin
// SPRING — for spatial motion (position, scale, rotation)
// Natural, physics feel. No fixed duration — ends when velocity reaches zero.
spring(
    dampingRatio = Spring.DampingRatioLowBouncy,   // bouncy — for delightful interactions
    // Spring.DampingRatioMediumBouncy               // subtle bounce — standard
    // Spring.DampingRatioNoBouncy                   // no bounce — for content transitions
    stiffness = Spring.StiffnessMediumLow            // slow and smooth
    // Spring.StiffnessMedium                         // standard
    // Spring.StiffnessHigh                           // fast (icon changes, quick snaps)
)

// TWEEN — for effects (opacity, color, blur)
// Fixed duration. Use M3 easing curves.
tween(
    durationMillis = Duration.medium2,         // from DesignTokens
    easing = AppEasing.EmphasizedDecel         // entering (from M3 Expressive spec)
    // AppEasing.EmphasizedAccel               // exiting
    // AppEasing.Standard                      // color, opacity changes
)

// KEYFRAMES — branded animations with precise control
keyframes {
    durationMillis = Duration.medium3
    0f   at 0                    with FastOutLinearInEasing
    1.15f at Duration.medium2    // overshoot
    1f   at Duration.medium3     with LinearOutSlowInEasing
}

// SNAP — instant, no animation (low-power mode, reduce motion)
snap()
```

## Rule 9: Respect reduced motion

```kotlin
// ✅ Always check system reduce motion setting
@Composable
fun MotionAwareAnimation(
    visible: Boolean,
    content: @Composable () -> Unit
) {
    // Check system accessibility setting
    val reducedMotion = LocalContext.current.getSystemService<AccessibilityManager>()
        ?.isEnabled == true

    if (reducedMotion) {
        // Instant transition — no motion
        if (visible) content()
    } else {
        AnimatedVisibility(visible, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
            content()
        }
    }
}

// ✅ Or via WindowManager accessibility
@Composable
fun rememberReducedMotion(): Boolean {
    val context = LocalContext.current
    return remember {
        val am = context.getSystemService<AccessibilityManager>()
        am?.isEnabled == true && am.isTouchExplorationEnabled
    }
}
```

## Common Mistakes

❌ `tween(300)` for spatial motion — use `spring()` for anything that moves
❌ No `label` parameter on animate* — hard to debug in profiler
❌ `AnimatedContent` without `contentKey` — wrong composable reused on state change
❌ Stacking animations without `SizeTransform` on count changes — layout jumps
❌ No reduce motion check — bad experience for accessibility users
❌ Hardcoded `300` ms — always use `Duration.*` tokens
❌ `FastOutSlowInEasing` everywhere — use M3 easing: `AppEasing.EmphasizedDecel` for enter, `AppEasing.EmphasizedAccel` for exit
❌ InfiniteTransition without performance check — pauses when app is backgrounded automatically, but don't add them to every screen
