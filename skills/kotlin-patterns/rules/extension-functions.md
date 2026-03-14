# Extension Functions — Idiomatic Android Patterns

**Impact: MEDIUM**

Extension functions add capabilities without inheritance, but overusing them
clutters the global namespace and makes code harder to navigate.

## Rule

### When to write extension functions

```kotlin
// ✅ Utility on a type you don't own (View, Context, String)
fun Context.dpToPx(dp: Float): Int =
    (dp * resources.displayMetrics.density).toInt()

fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) =
    Toast.makeText(this, message, duration).show()

// ✅ Fluent builder extensions
fun NavGraphBuilder.scanGraph(navController: NavController) {
    composable(Screen.Scan.route) { ScanScreen(navController) }
    composable(Screen.ScanResult.route) { ScanResultScreen(navController) }
}

// ✅ Type-safe conversion helpers
fun String.toLocalDate(): LocalDate = LocalDate.parse(this)
fun LocalDate.toDisplayString(): String = format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
fun Int.secondsToDisplayTime(): String = if (this < 60) "${this}s" else "${this / 60}m ${this % 60}s"

// ✅ Flow extensions for common patterns
fun <T> Flow<T>.throttleFirst(windowDuration: Long): Flow<T> = flow {
    var lastEmission = 0L
    collect { value ->
        val now = System.currentTimeMillis()
        if (now - lastEmission >= windowDuration) {
            lastEmission = now
            emit(value)
        }
    }
}

// ✅ String validation
fun String.isValidEmail(): Boolean =
    android.util.Patterns.EMAIL_ADDRESS.matcher(this).matches()

fun String.isValidPhoneNumber(): Boolean =
    android.util.Patterns.PHONE.matcher(this).matches()

fun String?.orEmpty(): String = this ?: ""
fun String?.isNotNullOrBlank(): Boolean = !isNullOrBlank()
```

### Where to put extension functions

```kotlin
// ✅ In a file named after the type being extended
// utils/ContextExtensions.kt   — Context extensions
// utils/StringExtensions.kt    — String extensions
// utils/FlowExtensions.kt      — Flow extensions
// ui/NavigationExtensions.kt   — NavGraphBuilder extensions

// ❌ Random extension functions scattered across feature files
// ❌ Extensions that belong as regular functions in a utility class
```

### Extension functions vs utility class

```kotlin
// ✅ Extension function — adds natural syntax to an existing type
fun List<Question>.filterBySubject(subject: String) =
    filter { it.subject.equals(subject, ignoreCase = true) }

// ✅ Regular function in object — for utilities not tied to a type
object DateUtils {
    fun formatRelativeTime(timestamp: Long): String { ... }
    fun isToday(date: LocalDate): Boolean { ... }
}
```

## Anti-Patterns

```kotlin
// ❌ Extension on Any — clutters everything
fun Any.log() = Timber.d(toString())   // ❌ appears on every object

// ❌ Extension hiding a method name — confusing
fun String.isEmpty() = length == 0   // ❌ conflicts with stdlib isEmpty()

// ❌ Business logic in extension functions — hard to test, no DI
fun Question.solve(): ScanResult {
    // ❌ network call in extension — can't inject dependencies
    return apiService.solve(this.text)
}
// ✅ Business logic belongs in Repository/UseCase

// ❌ Extension on a class you own — just add the method directly
class Question(val text: String)
fun Question.getWordCount() = text.split(" ").size  // ❌ add to the class instead
```
