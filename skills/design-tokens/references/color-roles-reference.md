# Color Roles Quick Reference

## All 30 M3 Color Roles

| Role | Light Mode Use | Dark Mode Use |
|---|---|---|
| primary | Brand buttons, FAB, key interactive | Same shifted lighter |
| onPrimary | Icons/text on primary | |
| primaryContainer | Tonal buttons, chip bg, selected state | |
| onPrimaryContainer | Text/icons on primary container | |
| secondary | Supporting brand, less prominent actions | |
| onSecondary | Content on secondary | |
| secondaryContainer | Filter chips, less prominent selections | |
| onSecondaryContainer | Content on secondary container | |
| tertiary | Contrasting accent, complementary | |
| onTertiary | Content on tertiary | |
| tertiaryContainer | Tertiary emphasis areas | |
| onTertiaryContainer | Content on tertiary container | |
| error | Error indicators, destructive actions | |
| onError | Content on error | |
| errorContainer | Error message backgrounds | |
| onErrorContainer | Error message text | |
| surface | Cards, sheets, dialogs | |
| onSurface | Primary text and icons | |
| onSurfaceVariant | Secondary text, placeholder text, inactive icons | |
| surfaceVariant | Input fields, slightly tinted surfaces | |
| surfaceContainerLowest | Very subtle backgrounds | |
| surfaceContainerLow | Subtle card bg, list bg | |
| surfaceContainer | Standard card bg | |
| surfaceContainerHigh | Elevated containers | |
| surfaceContainerHighest | Most elevated containers (dialogs) | |
| outline | Text field borders, dividers | |
| outlineVariant | Subtle dividers, card borders | |
| inverseSurface | Snackbar bg | |
| inverseOnSurface | Snackbar text | |
| inversePrimary | Links in snackbars | |
| scrim | Modal overlays | |
| background | Page background | |
| onBackground | Text directly on background | |

## When to Use Which Surface Container

```
Background (0dp) — page itself
surfaceContainerLowest — barely distinguishable from background
surfaceContainerLow — cards on background, list items
surfaceContainer — standard card, default modal surface  
surfaceContainerHigh — card on card, elevated panels
surfaceContainerHighest — dialogs, menus, highest modals
```

## Common Component → Color Role Mapping

| Component | Container | Content |
|---|---|---|
| Primary Button | primary | onPrimary |
| Tonal Button | secondaryContainer | onSecondaryContainer |
| Outlined Button | transparent | primary |
| Text Button | transparent | primary |
| Card | surfaceContainerLow | onSurface |
| Dialog | surfaceContainerHighest | onSurface |
| Bottom Sheet | surfaceContainerLow | onSurface |
| Navigation Bar | surfaceContainer | onSurfaceVariant (inactive), onSecondaryContainer (active) |
| Top App Bar | surface → surfaceContainerHighest (scrolled) | onSurface |
| FAB | primaryContainer | onPrimaryContainer |
| Input Field | surfaceVariant | onSurfaceVariant (label), onSurface (text) |
| Snackbar | inverseSurface | inverseOnSurface |
| Chip (unselected) | transparent | onSurfaceVariant |
| Chip (selected) | secondaryContainer | onSecondaryContainer |
| Badge | error | onError |
