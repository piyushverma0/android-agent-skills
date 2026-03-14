# Accessibility — Semantics, Content Descriptions, Touch Targets

**Impact: CRITICAL**

1 in 4 users has a disability. TalkBack users navigate entirely by content descriptions.
Missing semantics = broken app for screen reader users. Play Store rates accessibility.

## Rules

### 1. Every interactive element needs contentDescription

```kotlin
// ✅ Icon buttons — always provide contentDescription
IconButton(onClick = onBack) {
    Icon(
        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
        contentDescription = stringResource(R.string.cd_navigate_back)  // ← never null for interactive
    )
}

// ✅ Decorative images — explicitly null to skip TalkBack
Image(
    painter = painterResource(R.drawable.hero_background),
    contentDescription = null   // ← tells TalkBack to skip this element
)

// ✅ Informational images — describe what it conveys, not what it looks like
Image(
    painter = rememberAsyncImagePainter(user.avatarUrl),
    contentDescription = stringResource(R.string.cd_user_avatar, user.name)
    // "Profile photo of Piyush Verma" — not "circular image"
)

// ✅ Buttons with text — no contentDescription needed (text IS the description)
Button(onClick = onClick) {
    Text("Submit")   // TalkBack reads "Submit, button"
}

// ✅ Buttons with icon + text — no contentDescription on icon (text covers it)
Button(onClick = onClick) {
    Icon(Icons.Default.Send, contentDescription = null)  // ← null here
    Spacer(Modifier.width(8.dp))
    Text("Send")
}
```

### 2. Minimum 48dp touch target (Material requirement)

```kotlin
// ❌ 24dp icon with no size modifier — fails accessibility audit
Icon(Icons.Default.Close, contentDescription = "Close")

// ✅ Wrap in IconButton (always 48dp) or add minimumInteractiveComponentSize
IconButton(onClick = onClose) {
    Icon(Icons.Default.Close, contentDescription = stringResource(R.string.cd_close))
}

// ✅ Or use minimumInteractiveComponentSize for custom clickables
Box(
    modifier = Modifier
        .minimumInteractiveComponentSize()  // ← enforces 48dp touch target
        .clickable { onClick() }
) {
    SmallChip()
}
```

### 3. Merge semantics for compound components

```kotlin
// ❌ TalkBack reads each element separately: "Star icon", "4.5", "rating"
Row {
    Icon(Icons.Default.Star, contentDescription = "Star icon")
    Text("4.5")
    Text("rating")
}

// ✅ Merge into one announcement: "4.5 rating"
Row(
    modifier = Modifier.semantics(mergeDescendants = true) {}
) {
    Icon(Icons.Default.Star, contentDescription = null)  // ← suppressed, merged parent reads it
    Text("4.5")
    Text("rating")
}
```

### 4. Custom semantic actions for complex components

```kotlin
// ✅ SwipeToDismiss — TalkBack users can't swipe, so add custom action
Card(
    modifier = Modifier.semantics {
        customActions = listOf(
            CustomAccessibilityAction(
                label = "Delete notification",
                action = { onDelete(); true }
            )
        )
    }
) {
    NotificationContent()
}
```

### 5. stateDescription for dynamic state

```kotlin
// ✅ Announce state changes to TalkBack
val expandedState = if (expanded) "expanded" else "collapsed"
Card(
    modifier = Modifier
        .semantics {
            stateDescription = expandedState   // ← TalkBack announces on change
        }
        .clickable { expanded = !expanded }
) {
    ExpandableContent(expanded = expanded)
}
```

### 6. liveRegion for dynamic content updates

```kotlin
// ✅ Announce score changes to TalkBack without user interaction
Text(
    text = "Score: $score",
    modifier = Modifier.semantics {
        liveRegion = LiveRegionMode.Polite  // ← announces changes when idle
        // LiveRegionMode.Assertive — interrupts immediately (use sparingly)
    }
)
```

### 7. heading for section titles (improves navigation)

```kotlin
// ✅ Screen reader users can jump between headings
Text(
    text = "Step-by-step explanation",
    style = MaterialTheme.typography.titleLarge,
    modifier = Modifier.semantics { heading() }  // ← marks as navigation landmark
)
```

### 8. String resources for all user-visible text

```kotlin
// ❌ Hardcoded strings break localization and make a11y strings inconsistent
contentDescription = "Back button"

// ✅ String resources always
contentDescription = stringResource(R.string.cd_navigate_back)
```

## Accessibility Testing Checklist

```
□ Every Icon in IconButton has a non-null contentDescription
□ Decorative Images have contentDescription = null
□ All interactive elements are at least 48×48dp
□ Text contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
□ No information conveyed by color alone (add shape/text indicator)
□ All form fields have labels (use label parameter in TextField)
□ Dynamic content uses liveRegion or stateDescription
□ Custom gestures have accessibility action alternatives
□ Test with TalkBack enabled: Settings → Accessibility → TalkBack
□ ComposeTestRule: onNodeWithContentDescription("...").assertExists()
```
