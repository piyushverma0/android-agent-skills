# Semantic Color Usage — Status, Feedback, and Brand Colors

**Impact: CRITICAL**

Status colors (success green, error red, warning yellow) must be consistent
across the entire app. Fintech apps that show a red number sometimes and an
orange number other times confuse users. Every status must have exactly one
color representation, defined as a token.

## Standard Semantic Color Tokens

```kotlin
// Define in your theme — these extend M3's color system
object SemanticColors {
    // Success — positive outcomes, completed actions, gains
    val SuccessLight = Color(0xFF2E7D32)    // dark green — on light background
    val SuccessContainer = Color(0xFFE8F5E9) // light green container
    val OnSuccessContainer = Color(0xFF1B5E20)

    val SuccessDark = Color(0xFF81C784)     // light green — on dark background
    val SuccessContainerDark = Color(0xFF1B5E20)
    val OnSuccessContainerDark = Color(0xFFA5D6A7)

    // Warning — attention needed, pending states, caution
    val WarningLight = Color(0xFFE65100)    // deep orange — on light
    val WarningContainer = Color(0xFFFFF3E0)
    val OnWarningContainer = Color(0xFFBF360C)

    val WarningDark = Color(0xFFFFB74D)     // light orange — on dark
    val WarningContainerDark = Color(0xFFBF360C)
    val OnWarningContainerDark = Color(0xFFFFE0B2)

    // Info — neutral information, hints, processing
    val InfoLight = Color(0xFF0277BD)
    val InfoContainer = Color(0xFFE3F2FD)
    val OnInfoContainer = Color(0xFF01579B)

    val InfoDark = Color(0xFF4FC3F7)
    val InfoContainerDark = Color(0xFF01579B)
    val OnInfoContainerDark = Color(0xFFB3E5FC)
}
```

## App-Category Semantic Colors

```kotlin
// Fintech — financial semantic colors
object FinancialColors {
    // Gains/profits — always green family
    val Gain = Color(0xFF2E7D32)          // positive P&L, received money
    val GainLight = Color(0xFFE8F5E9)     // background for gain values

    // Loss/expense — always red family
    val Loss = Color(0xFFC62828)          // negative P&L, sent money
    val LossLight = Color(0xFFFFEBEE)     // background for loss values

    // Pending — always amber/orange
    val Pending = Color(0xFFE65100)       // pending transaction
    val PendingLight = Color(0xFFFFF3E0)

    // NEVER use green for sent/debit and red for received/credit
    // This is the most common fintech color mistake
}

// Healthtech — health semantic colors
object HealthColors {
    val Excellent = Color(0xFF2E7D32)   // great health metrics
    val Good = Color(0xFF558B2F)        // good range
    val Fair = Color(0xFFF9A825)        // borderline
    val Poor = Color(0xFFD84315)        // concerning
    val Critical = Color(0xFFB71C1C)    // requires attention

    val HeartRate = Color(0xFFE53935)   // heart rate always red
    val Sleep = Color(0xFF4A148C)       // sleep always deep purple/indigo
    val Steps = Color(0xFF1565C0)       // activity/steps always blue
    val Calories = Color(0xFFE65100)    // calories always orange
    val Water = Color(0xFF0288D1)       // hydration always light blue
}

// Edtech — learning semantic colors
object LearningColors {
    val Correct = Color(0xFF2E7D32)     // correct answer — green
    val Incorrect = Color(0xFFC62828)  // wrong answer — red
    val Skipped = Color(0xFF757575)    // skipped — gray
    val Streak = Color(0xFFFF6D00)     // streak flame — orange
    val Achievement = Color(0xFFFFD600) // badges/achievements — gold
    val Progress = Color(0xFF1565C0)   // progress bars — blue
}
```

## Status Badge Pattern

```kotlin
// ✅ Consistent status badges across the app
@Composable
fun StatusBadge(status: Status) {
    val (containerColor, contentColor, label) = when (status) {
        Status.SUCCESS -> Triple(
            SemanticColors.SuccessContainer,
            SemanticColors.OnSuccessContainer,
            "Completed"
        )
        Status.PENDING -> Triple(
            SemanticColors.WarningContainer,
            SemanticColors.OnWarningContainer,
            "Pending"
        )
        Status.FAILED -> Triple(
            MaterialTheme.colorScheme.errorContainer,
            MaterialTheme.colorScheme.onErrorContainer,
            "Failed"
        )
        Status.INFO -> Triple(
            SemanticColors.InfoContainer,
            SemanticColors.OnInfoContainer,
            "Processing"
        )
    }
    Surface(
        color = containerColor,
        shape = MaterialTheme.shapes.extraSmall
    ) {
        Text(
            text = label,
            color = contentColor,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Different greens for success across screens
// Screen A: Color(0xFF4CAF50) for success
// Screen B: Color(0xFF66BB6A) for success
// Screen C: Color(0xFF2E7D32) for success
// → user perceives 3 different meaning levels

// ❌ Red for sent money in fintech (correct) AND red for alerts (correct)
// but also red for "sale" discount badge (wrong — confuses transaction semantics)

// ❌ Green for profit, green for available (same green)
// → "is this a gain or just available balance?" — ambiguous

// ❌ Status colors that don't adapt to dark mode
Text(color = Color(0xFF2E7D32))  // dark green — invisible in dark mode on dark green bg
// ✅ Use SemanticColors.Gain in light mode, SemanticColors.GainDark in dark mode
```
