---
name: design-system
description: |
  Design system for Android — consistent spacing, typography, color roles, and components
  across all screens. Use this skill whenever multiple screens need to look consistent,
  when creating a theme, defining spacing, type scale, color palette, component library,
  design tokens, 8dp grid, typography scale, color scheme, brand colors, custom theme,
  button styles, card styles, component consistency, or when any screen looks visually
  different from the others. Always apply when starting a new app or adding a new screen —
  AI agents without this skill produce apps where every screen looks designed by a different person.
---

# Design System

A design system makes AI-built apps look professional. Without it, every screen is a snowflake.
These rules enforce consistency in spacing, typography, color, and components.

## The 8dp grid — foundation of all spacing

Every spacing value must be a multiple of 4dp. Prefer multiples of 8dp.

```kotlin
// ✅ Design tokens — define once, use everywhere
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
    val xxxl = 64.dp
}

// ✅ Usage
Column(
    verticalArrangement = Arrangement.spacedBy(Spacing.sm),
    modifier = Modifier.padding(Spacing.md)
) { ... }

// ❌ Arbitrary spacing — inconsistent, impossible to maintain
modifier = Modifier.padding(13.dp)   // 13dp? not on the grid
modifier = Modifier.padding(top = 20.dp, bottom = 15.dp, start = 18.dp)
```

## Typography scale

```kotlin
// ✅ Extend Material 3's type system with your custom fonts
val AppTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp, lineHeight = 64.sp, letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 45.sp, lineHeight = 52.sp
    ),
    headlineLarge = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 32.sp, lineHeight = 40.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp, lineHeight = 36.sp
    ),
    titleLarge = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp, lineHeight = 28.sp
    ),
    titleMedium = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.25.sp
    ),
    labelLarge = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp
    ),
    labelSmall = TextStyle(
        fontFamily = BrandFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp
    )
)

// ✅ Usage — always use theme text styles, never hardcode
Text(text = title, style = MaterialTheme.typography.titleLarge)
Text(text = body, style = MaterialTheme.typography.bodyMedium)

// ❌ Never hardcode font size — breaks when theme changes
Text(text = title, fontSize = 20.sp, fontWeight = FontWeight.Bold)
```

## Color system — Material 3 color roles

```kotlin
// ✅ Define custom color scheme from brand colors
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF006BFF),           // Brand blue
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD8E2FF),
    onPrimaryContainer = Color(0xFF001A41),
    secondary = Color(0xFF565E71),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFDAE2F9),
    onSecondaryContainer = Color(0xFF131C2B),
    tertiary = Color(0xFF715573),
    onTertiary = Color(0xFFFFFFFF),
    background = Color(0xFFFEFBFF),
    onBackground = Color(0xFF1B1B1F),
    surface = Color(0xFFFEFBFF),
    onSurface = Color(0xFF1B1B1F),
    surfaceVariant = Color(0xFFE1E2EC),
    onSurfaceVariant = Color(0xFF44464F),
    error = Color(0xFFBA1A1A),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    outline = Color(0xFF74777F),
    outlineVariant = Color(0xFFC4C6D0)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFAEC6FF),
    onPrimary = Color(0xFF002E69),
    primaryContainer = Color(0xFF004495),
    onPrimaryContainer = Color(0xFFD8E2FF),
    secondary = Color(0xFFBEC6DC),
    onSecondary = Color(0xFF283041),
    secondaryContainer = Color(0xFF3E4759),
    onSecondaryContainer = Color(0xFFDAE2F9),
    background = Color(0xFF1B1B1F),
    onBackground = Color(0xFFE4E2E6),
    surface = Color(0xFF1B1B1F),
    onSurface = Color(0xFFE4E2E6)
)

@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,    // Android 12+ Material You
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
```

## Shape system

```kotlin
// ✅ Consistent corner radii across components
val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),   // chips, small badges
    small = RoundedCornerShape(8.dp),         // text fields, small cards
    medium = RoundedCornerShape(12.dp),       // cards, dialogs
    large = RoundedCornerShape(16.dp),        // bottom sheets, large cards
    extraLarge = RoundedCornerShape(28.dp)    // large dialogs, side sheets
)
```

## Component library — standardize common UI

```kotlin
// ✅ AppButton — standardized button with consistent sizing
@Composable
fun AppButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    style: ButtonStyle = ButtonStyle.Primary,
    isLoading: Boolean = false,
    enabled: Boolean = true
) {
    when (style) {
        ButtonStyle.Primary -> Button(
            onClick = onClick,
            modifier = modifier.height(48.dp),
            enabled = enabled && !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(text = text, style = MaterialTheme.typography.labelLarge)
            }
        }
        ButtonStyle.Secondary -> OutlinedButton(
            onClick = onClick,
            modifier = modifier.height(48.dp),
            enabled = enabled && !isLoading
        ) {
            Text(text = text, style = MaterialTheme.typography.labelLarge)
        }
        ButtonStyle.Ghost -> TextButton(
            onClick = onClick,
            modifier = modifier.height(48.dp),
            enabled = enabled && !isLoading
        ) {
            Text(text = text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

enum class ButtonStyle { Primary, Secondary, Ghost }
```

```kotlin
// ✅ AppCard — consistent card styling across all screens
@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val cardModifier = modifier.padding(horizontal = Spacing.md, vertical = Spacing.xs)

    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = cardModifier,
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(Spacing.md), content = content)
        }
    } else {
        Card(
            modifier = cardModifier,
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(Spacing.md), content = content)
        }
    }
}
```

```kotlin
// ✅ AppTextField — consistent text input
@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    isError: Boolean = false,
    errorMessage: String? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    singleLine: Boolean = true
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            placeholder = placeholder?.let { { Text(it) } },
            isError = isError,
            keyboardOptions = keyboardOptions,
            singleLine = singleLine,
            shape = MaterialTheme.shapes.small,
            modifier = Modifier.fillMaxWidth()
        )
        if (isError && errorMessage != null) {
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(start = Spacing.md, top = Spacing.xs)
            )
        }
    }
}
```

## Loading, Empty, and Error states — define once, use everywhere

```kotlin
// ✅ Standard loading state
@Composable
fun LoadingScreen(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
    }
}

// ✅ Standard empty state with illustration slot
@Composable
fun EmptyScreen(
    title: String,
    description: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
    illustration: (@Composable () -> Unit)? = null
) {
    Column(
        modifier = modifier.fillMaxSize().padding(Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        illustration?.invoke()
        Spacer(modifier = Modifier.height(Spacing.lg))
        Text(text = title, style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(Spacing.sm))
        Text(text = description, style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        if (action != null) {
            Spacer(modifier = Modifier.height(Spacing.lg))
            action()
        }
    }
}

// ✅ Standard error state
@Composable
fun ErrorScreen(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize().padding(Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(Spacing.md))
        Text(text = "Something went wrong", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(Spacing.sm))
        Text(text = message, style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        Spacer(modifier = Modifier.height(Spacing.lg))
        AppButton(text = "Try again", onClick = onRetry)
    }
}
```

## Common Mistakes

❌ Spacing values not on 4dp grid — always use Spacing.xs/sm/md/lg/xl
❌ Hardcoded font sizes — always MaterialTheme.typography.*
❌ Hardcoded colors — always MaterialTheme.colorScheme.*
❌ Different button heights per screen — standardize to 48.dp
❌ Custom loading spinners per screen — use LoadingScreen()
❌ Missing dark mode — always test with darkTheme = true
❌ No shape system — cards with random cornerRadius values

## Deep-dive references

- `references/design-tokens.md` — full token system for complex apps
- `references/custom-fonts.md` — loading fonts from assets with FontFamily
