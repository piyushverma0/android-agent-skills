# Brand Color Integration — Injecting Brand into M3

**Impact: HIGH**

Every company has a brand color. The challenge is integrating it into M3's
role system correctly — so the brand feels present without breaking contrast
ratios, dark mode, or dynamic color fallback. Apps like PhonePe, CRED, and
Swiggy each have strong brand identities that work correctly in both themes.

## Category Brand Color Strategies

```kotlin
// FINTECH — trust-first brands (HDFC, SBI, Paytm, PhonePe)
// Primary brand color is the dominant surface color
// Keep brand color for interactive elements only, not backgrounds
private val HDFCLightScheme = lightColorScheme(
    primary = Color(0xFF004C8C),      // HDFC deep blue
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD6E4FF),
    onPrimaryContainer = Color(0xFF001B3D),
    // Surfaces remain neutral — bank credibility comes from clean whites
    surface = Color(0xFFF8F9FA),
    background = Color(0xFFF8F9FA),
)

// EDTECH — energetic/motivating brands (Duolingo green, BYJU's purple, Unacademy black)
private val EdtechLightScheme = lightColorScheme(
    primary = Color(0xFF58CC02),      // Duolingo-style bright green
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE8F5E9),
    onPrimaryContainer = Color(0xFF1B5E20),
    secondary = Color(0xFF1CB0F6),    // blue accent for secondary actions
    tertiary = Color(0xFFFF9600),     // orange for streaks, achievements
)

// HEALTHTECH — calm/clinical brands (Cult.fit, HealthifyMe, Apollo)
private val HealthtechLightScheme = lightColorScheme(
    primary = Color(0xFF00897B),      // teal — calm, medical, trustworthy
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE0F2F1),
    onPrimaryContainer = Color(0xFF004D40),
    tertiary = Color(0xFFE53935),     // heart rate red — semantic use only
)

// ECOMMERCE — conversion-focused brands (Meesho pink, Nykaa pink, Myntra)
private val EcommerceLightScheme = lightColorScheme(
    primary = Color(0xFFE91E8C),      // brand pink
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFE4F3),
    secondary = Color(0xFFFF6B35),    // orange for sale/discount
    tertiary = Color(0xFF2196F3),     // blue for trust badges
)

// PROPTECH — professional/premium brands (99acres, MagicBricks, NoBroker)
private val ProptechLightScheme = lightColorScheme(
    primary = Color(0xFF0057B8),      // professional blue
    onPrimary = Color.White,
    secondary = Color(0xFFFF6B00),    // orange for highlighted listings
    tertiary = Color(0xFF4CAF50),     // green for verified/available
)

// SOCIAL — personal/vibrant brands
private val SocialLightScheme = lightColorScheme(
    primary = Color(0xFF1DA1F2),      // blue-family social primary
    secondary = Color(0xFF17BF63),    // green for positive actions
    tertiary = Color(0xFFE0245E),     // red/pink for likes/hearts
)
```

## Brand Color Contrast Requirements

```kotlin
// Every brand primary must meet WCAG AA contrast ratio (4.5:1 for normal text)
// Against White (#FFFFFF):
// Color(0xFF006C51) → contrast 5.1:1 ✅ passes AA
// Color(0xFF4CAF50) → contrast 2.8:1 ❌ fails AA — too light for text on white

// If brand color is too light for text, use it as a container:
primaryContainer = BrandColor       // use brand as background
onPrimaryContainer = DarkVariant    // use dark variant for text on brand bg
// Never: Text(color = BrandColor) on white if contrast < 4.5:1

// Check contrast: https://webaim.org/resources/contrastchecker/

// ✅ Correct for light brand colors (Duolingo green, etc.)
Button(
    colors = ButtonDefaults.buttonColors(
        containerColor = Color(0xFF58CC02),  // brand green bg
        contentColor = Color.White           // must verify contrast: 58CC02 on white text
    )
)
// 58CC02 on white = 2.4:1 ❌ — use white text on #58CC02 bg instead
// White on #58CC02 = 2.4:1 ❌ still fails
// Solution: darken to #3D9B00 → 4.6:1 ✅ passes AA
```

## Anti-Patterns

```kotlin
// ❌ Brand color used for body text
Text(
    text = "Your account balance",
    color = MaterialTheme.colorScheme.primary  // primary is for interactive elements
)
// ✅ MaterialTheme.colorScheme.onBackground or onSurface for body text

// ❌ Brand color for error state
// Brand is green → error is also green-tinted → users can't tell success from error
// ✅ Always use MaterialTheme.colorScheme.error for errors regardless of brand

// ❌ Same brand color for all interactive elements (buttons, links, icons, FAB)
// Everything looks the same importance level
// ✅ Primary brand for primary CTA, secondary for secondary, tertiary for accents

// ❌ Brand color doesn't have dark mode variant
// Light: primary = Color(0xFF006C51) (dark green)
// Dark: primary = Color(0xFF006C51) (same dark green — too dark for dark bg)
// ✅ Dark: primary = Color(0xFF68DBA8) (light green, passes contrast on dark bg)
```
