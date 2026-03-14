# Rule: Use type-safe route contracts
**Impact:** HIGH

Avoid inline route strings and pass primitive IDs through nav args.

```kotlin
// ❌ Wrong — inline route and complex payload in route string.
fun wrongNavigate(navController: NavController, userJson: String) {
    navController.navigate("profile/$userJson")
}

// ✅ Correct — sealed route contract with primitive arg.
sealed class AppRoute(val route: String) {
    data object Home : AppRoute("home")
    data object Profile : AppRoute("profile/{userId}") {
        fun create(userId: Long): String = "profile/$userId"
    }
}

fun correctNavigate(navController: NavController, userId: Long) {
    navController.navigate(AppRoute.Profile.create(userId = userId))
}
```
