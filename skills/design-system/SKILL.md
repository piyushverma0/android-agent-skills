---
name: design-system
description: |
  Global-level design system for Android AI agents — Material 3 Expressive. Use this skill
  for visual consistency: spacing tokens, 8dp grid, M3 typography scale (15 styles), HCT
  color system, dynamic color Material You, shape system with morphing, motion tokens,
  physics-based spring animations, design tokens, AppButton/AppCard/AppTextField components,
  loading/error/empty states, dark mode, surface containers, tonal elevation, or when any
  two screens look visually different. Always apply when starting any new screen — without
  this skill AI agents produce apps where every screen looks designed by a different person.
  Apply immediately alongside compose-ui, material3, and adaptive-ui skills.
---

# Design System — Global Level (M3 Expressive)

Material 3 Expressive is Google's most advanced design language — physics-based motion,
HCT color science, shape morphing, and a full token architecture. These rules make
AI-built apps feel professional, personal, and visually unified across every screen.

## Token architecture — single source of truth

```kotlin
// ui/theme/tokens/DesignTokens.kt — define once, reference everywhere

object Spacing {
    val none  = 0.dp
    val xs    = 4.dp    // micro: badges, icon gaps
    val sm    = 8.dp    // tight: list item gaps
    val md    = 16.dp   // standard: screen padding, card padding
    val lg    = 24.dp   // section: gaps between content groups
    val xl    = 32.dp   // large: hero padding
    val xxl   = 48.dp   // extra: section breaks
    val xxxl  = 64.dp   // massive: onboarding, splash
}

object Elevation {
    val none   = 0.dp   // flat — standard cards
    val level1 = 1.dp   // slightly raised
    val level2 = 3.dp   // FAB, raised cards
    val level3 = 6.dp   // dialogs
    val level4 = 8.dp   // navigation drawers
    val level5 = 12.dp  // tooltips
}

// M3 Expressive motion duration tokens (replaces ALL hardcoded ms)
object Duration {
    const val short1      = 50    // micro: icon swap
    const val short2      = 100   // fast: color shift
    const val short3      = 150   // quick: appear short distance
    const val short4      = 200   // standard fade
    const val medium1     = 250   // expand/collapse
    const val medium2     = 300   // default transition
    const val medium3     = 350   // complex motion
    const val medium4     = 400   // enter from edge
    const val long1       = 450   // large surface
    const val long2       = 500   // full-screen takeover
    const val extraLong1  = 700   // emphasis / delight
}

// M3 Expressive easing curves (physics-based)
object AppEasing {
    val Standard        = CubicBezierEasing(0.2f, 0f, 0f, 1f)
    val EmphasizedDecel = CubicBezierEasing(0.05f, 0.7f, 0.1f, 1f)  // new content entering
    val EmphasizedAccel = CubicBezierEasing(0.3f, 0f, 0.8f, 0.15f)  // content leaving
    val Linear          = LinearEasing
}
```

## Theme setup — dynamic color + MotionScheme

```kotlin
// ui/theme/AppTheme.kt
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
        darkTheme -> AppDarkColorScheme
        else      -> AppLightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
```

## Color system — HCT-generated M3 palette

```kotlin
// ui/theme/AppColorScheme.kt
// Generate yours at: material-foundation.com/tools/theme-builder
// M3 uses HCT (Hue/Chroma/Tone) — perceptually uniform, WCAG contrast by construction

private val AppLightColorScheme = lightColorScheme(
    primary               = Color(0xFF1A73E8),
    onPrimary             = Color(0xFFFFFFFF),
    primaryContainer      = Color(0xFFD3E3FD),
    onPrimaryContainer    = Color(0xFF041E49),
    secondary             = Color(0xFF5F6368),
    onSecondary           = Color(0xFFFFFFFF),
    secondaryContainer    = Color(0xFFE8EAED),
    onSecondaryContainer  = Color(0xFF202124),
    tertiary              = Color(0xFF006E56),
    onTertiary            = Color(0xFFFFFFFF),
    tertiaryContainer     = Color(0xFF7AF8D3),
    onTertiaryContainer   = Color(0xFF002117),
    error                 = Color(0xFFB3261E),
    onError               = Color(0xFFFFFFFF),
    errorContainer        = Color(0xFFF9DEDC),
    onErrorContainer      = Color(0xFF410E0B),
    background            = Color(0xFFFEFBFF),
    onBackground          = Color(0xFF1C1B1F),
    surface               = Color(0xFFFEFBFF),
    onSurface             = Color(0xFF1C1B1F),
    surfaceVariant        = Color(0xFFE7E0EC),
    onSurfaceVariant      = Color(0xFF49454F),
    outline               = Color(0xFF79747E),
    outlineVariant        = Color(0xFFCAC4D0),
    // Surface container hierarchy — tonal elevation without shadows
    surfaceContainerLowest  = Color(0xFFFFFFFF),
    surfaceContainerLow     = Color(0xFFF7F2FA),
    surfaceContainer        = Color(0xFFF3EDF7),
    surfaceContainerHigh    = Color(0xFFECE6F0),
    surfaceContainerHighest = Color(0xFFE6E0E9),
)

private val AppDarkColorScheme = darkColorScheme(
    primary               = Color(0xFFAECBFA),
    onPrimary             = Color(0xFF0A3775),
    primaryContainer      = Color(0xFF2860C4),
    onPrimaryContainer    = Color(0xFFD3E3FD),
    secondary             = Color(0xFFBCC7DC),
    onSecondary           = Color(0xFF263141),
    surface               = Color(0xFF141218),
    onSurface             = Color(0xFFE6E1E5),
    surfaceVariant        = Color(0xFF49454F),
    onSurfaceVariant      = Color(0xFFCAC4D0),
    surfaceContainerLowest  = Color(0xFF0F0D13),
    surfaceContainerLow     = Color(0xFF1D1B20),
    surfaceContainer        = Color(0xFF211F26),
    surfaceContainerHigh    = Color(0xFF2B2930),
    surfaceContainerHighest = Color(0xFF36343B),
    error                 = Color(0xFFF2B8B5),
    errorContainer        = Color(0xFF8C1D18),
    outline               = Color(0xFF938F99),
    outlineVariant        = Color(0xFF49454F),
)
```

## Typography — M3 Expressive 15-style scale

```kotlin
// ui/theme/AppTypography.kt
private val BrandFont = FontFamily(
    Font(R.font.brand_regular,  FontWeight.Normal),
    Font(R.font.brand_medium,   FontWeight.Medium),
    Font(R.font.brand_semibold, FontWeight.SemiBold),
    Font(R.font.brand_bold,     FontWeight.Bold),
)

val AppTypography = Typography(
    displayLarge  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Normal,  fontSize = 57.sp, lineHeight = 64.sp,  letterSpacing = (-0.25).sp),
    displayMedium = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Normal,  fontSize = 45.sp, lineHeight = 52.sp),
    displaySmall  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Normal,  fontSize = 36.sp, lineHeight = 44.sp),
    headlineLarge  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.SemiBold, fontSize = 32.sp, lineHeight = 40.sp),
    headlineMedium = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.SemiBold, fontSize = 28.sp, lineHeight = 36.sp),
    headlineSmall  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp),
    titleLarge  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Medium, fontSize = 22.sp, lineHeight = 28.sp),
    titleMedium = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp),
    titleSmall  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    bodyLarge  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.5.sp),
    bodyMedium = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.25.sp),
    bodySmall  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.4.sp),
    labelLarge  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
    labelMedium = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
    labelSmall  = TextStyle(fontFamily = BrandFont, fontWeight = FontWeight.Medium, fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
)

// ✅ Always use theme styles — never hardcode font size
Text("Screen title", style = MaterialTheme.typography.titleLarge)
Text("Body text", style = MaterialTheme.typography.bodyMedium)
Text("Button label", style = MaterialTheme.typography.labelLarge)

// ❌ Never hardcode
Text("Wrong", fontSize = 18.sp, fontWeight = FontWeight.Bold)
```

## Shape system — M3 10-step scale + asymmetric shapes

```kotlin
// ui/theme/AppShapes.kt
val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),    // chips, small tags
    small      = RoundedCornerShape(8.dp),    // text fields, tooltips
    medium     = RoundedCornerShape(12.dp),   // cards, menus
    large      = RoundedCornerShape(16.dp),   // bottom sheets
    extraLarge = RoundedCornerShape(28.dp),   // nav drawer, large dialogs
)

// M3 Expressive asymmetric shapes — personality and directional emphasis
object AsymmetricShapes {
    val topRounded    = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp, bottomStart = 4.dp, bottomEnd = 4.dp)
    val bottomRounded = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp, bottomStart = 28.dp, bottomEnd = 28.dp)
    val startRounded  = RoundedCornerShape(topStart = 28.dp, bottomStart = 28.dp, topEnd = 4.dp, bottomEnd = 4.dp)
    val full          = RoundedCornerShape(50)  // pills, FABs, avatars
}
```

## Component library — standard across every screen

```kotlin
// ✅ AppButton — 5 variants, consistent 48dp height, loading state
enum class AppButtonVariant { Filled, Tonal, Outlined, Ghost, Destructive }

@Composable
fun AppButton(
    text: String, onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: AppButtonVariant = AppButtonVariant.Filled,
    leadingIcon: ImageVector? = null,
    isLoading: Boolean = false,
    enabled: Boolean = true,
) {
    val enabled2 = enabled && !isLoading
    val shape = MaterialTheme.shapes.small
    val content: @Composable RowScope.() -> Unit = {
        AnimatedContent(isLoading, label = "btnContent") { loading ->
            if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = LocalContentColor.current)
            else Row(verticalAlignment = Alignment.CenterVertically) {
                if (leadingIcon != null) { Icon(leadingIcon, null, Modifier.size(18.dp)); Spacer(Modifier.width(Spacing.xs)) }
                Text(text, style = MaterialTheme.typography.labelLarge)
            }
        }
    }
    val mod = modifier.height(48.dp)
    when (variant) {
        AppButtonVariant.Filled      -> Button(onClick, mod, enabled = enabled2, shape = shape, content = content)
        AppButtonVariant.Tonal       -> FilledTonalButton(onClick, mod, enabled = enabled2, shape = shape, content = content)
        AppButtonVariant.Outlined    -> OutlinedButton(onClick, mod, enabled = enabled2, shape = shape, content = content)
        AppButtonVariant.Ghost       -> TextButton(onClick, mod, enabled = enabled2, content = content)
        AppButtonVariant.Destructive -> Button(onClick, mod, enabled = enabled2, shape = shape,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.errorContainer,
                contentColor = MaterialTheme.colorScheme.onErrorContainer), content = content)
    }
}

// ✅ AppCard — 3 variants
enum class CardVariant { Filled, Elevated, Outlined }

@Composable
fun AppCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, variant: CardVariant = CardVariant.Filled, content: @Composable ColumnScope.() -> Unit) {
    val inner: @Composable () -> Unit = { Column(Modifier.padding(Spacing.md), content = content) }
    val shape = MaterialTheme.shapes.medium
    if (onClick != null) when (variant) {
        CardVariant.Elevated -> ElevatedCard(onClick, modifier, shape = shape) { inner() }
        CardVariant.Outlined -> OutlinedCard(onClick, modifier, shape = shape) { inner() }
        else -> Card(onClick, modifier, shape = shape, elevation = CardDefaults.cardElevation(0.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) { inner() }
    } else Card(modifier = modifier, shape = shape, elevation = CardDefaults.cardElevation(0.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh)) { inner() }
}

// ✅ AppTextField — error state, support text, icons
@Composable
fun AppTextField(
    value: String, onValueChange: (String) -> Unit, label: String,
    modifier: Modifier = Modifier,
    supportingText: String? = null, isError: Boolean = false, errorText: String? = null,
    leadingIcon: ImageVector? = null, trailingIcon: (@Composable () -> Unit)? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    singleLine: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    OutlinedTextField(
        value = value, onValueChange = onValueChange, label = { Text(label) },
        isError = isError, singleLine = singleLine,
        visualTransformation = visualTransformation,
        leadingIcon = leadingIcon?.let { { Icon(it, null) } },
        trailingIcon = trailingIcon,
        supportingText = when {
            isError && errorText != null -> { { Text(errorText, color = MaterialTheme.colorScheme.error) } }
            supportingText != null -> { { Text(supportingText) } }
            else -> null
        },
        keyboardOptions = keyboardOptions,
        shape = MaterialTheme.shapes.small,
        modifier = modifier.fillMaxWidth()
    )
}
```

## Motion tokens — physics-based, M3 Expressive

```kotlin
// ui/theme/tokens/MotionTokens.kt
object MotionTokens {
    // Spatial — elements that move or scale (use spring for naturalness)
    fun spatialEnter() = spring<Float>(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow)
    fun spatialExit()  = tween<Float>(Duration.short4, easing = AppEasing.EmphasizedAccel)

    // Effects — color, opacity, elevation (use tween)
    fun effectsStandard(duration: Int = Duration.medium2) = tween<Float>(duration, easing = AppEasing.Standard)
    fun effectsDecel(duration: Int = Duration.medium4)    = tween<Float>(duration, easing = AppEasing.EmphasizedDecel)

    // Container — screen-level transitions
    fun containerEnter() = tween<IntOffset>(Duration.medium4, easing = AppEasing.EmphasizedDecel)
    fun containerExit()  = tween<IntOffset>(Duration.short4,  easing = AppEasing.EmphasizedAccel)
}

// ✅ Usage — always MotionTokens, never tween(300)
val alpha by animateFloatAsState(
    targetValue = if (isVisible) 1f else 0f,
    animationSpec = MotionTokens.effectsStandard(),
    label = "alpha"
)
```

## Screen states — global, use on every screen

```kotlin
@Composable
fun AppLoadingScreen(modifier: Modifier = Modifier) =
    Box(modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }

@Composable
fun AppEmptyScreen(title: String, body: String, modifier: Modifier = Modifier,
    illustration: (@Composable () -> Unit)? = null, action: Pair<String, () -> Unit>? = null) {
    Column(modifier.fillMaxSize().padding(Spacing.xl), Alignment.CenterHorizontally, Arrangement.Center) {
        illustration?.invoke()
        Spacer(Modifier.height(Spacing.lg))
        Text(title, style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Spacer(Modifier.height(Spacing.sm))
        Text(body, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (action != null) { Spacer(Modifier.height(Spacing.lg)); AppButton(action.first, action.second) }
    }
}

@Composable
fun AppErrorScreen(message: String, onRetry: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxSize().padding(Spacing.xl), Alignment.CenterHorizontally, Arrangement.Center) {
        Icon(Icons.Rounded.ErrorOutline, null, Modifier.size(64.dp), tint = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(Spacing.md))
        Text("Something went wrong", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(Spacing.sm))
        Text(message, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (onRetry != null) { Spacer(Modifier.height(Spacing.lg)); AppButton("Try again", onRetry, variant = AppButtonVariant.Tonal) }
    }
}
```

## Common Mistakes

❌ Spacing not on 4dp grid — `padding(13.dp)` use Spacing.sm or Spacing.md
❌ `fontSize = 20.sp` hardcoded — `MaterialTheme.typography.titleLarge`
❌ `Color(0xFF333333)` hardcoded — `MaterialTheme.colorScheme.onSurface`
❌ `cornerRadius = 12.dp` inline — `MaterialTheme.shapes.medium`
❌ `tween(300)` hardcoded — `MotionTokens.effectsStandard()`
❌ Different button heights per screen — always 48.dp
❌ No dark mode testing — check every component with `darkTheme = true`
❌ Dynamic color disabled — enable for Android 12+, fallback palette for older
❌ `Color.White` in dark mode — `MaterialTheme.colorScheme.surface`
❌ `Card(elevation = 4.dp)` — use tonal containers, not shadows: `surfaceContainerHigh`
