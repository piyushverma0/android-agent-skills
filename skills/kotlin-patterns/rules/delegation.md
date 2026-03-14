# Delegation and Lazy Initialization

**Impact: MEDIUM**

Eager initialization of heavy objects wastes memory. Manual delegation
boilerplate is replaced by Kotlin's built-in delegate syntax.

## Rule

### lazy — initialize on first access

```kotlin
// ✅ Heavy object initialized only when first used
class QuestionViewModel : ViewModel() {
    // Regex compiled once, on first use
    private val emailRegex by lazy {
        Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    }

    // DateFormatter created once
    private val dateFormatter by lazy {
        DateTimeFormatter.ofPattern("MMM dd, yyyy")
    }

    fun formatDate(date: LocalDate) = date.format(dateFormatter)
    fun isValidEmail(email: String) = emailRegex.matches(email)
}

// ✅ Lazy with custom thread safety mode
private val heavyResource by lazy(LazyThreadSafetyMode.NONE) {
    // NONE — faster, use when only accessed from main thread
    ExpensiveObject()
}
```

### by Delegates.observable — react to property changes

```kotlin
// ✅ Observe property changes without backing field + setter boilerplate
class SettingsViewModel : ViewModel() {
    var selectedTheme: Theme by Delegates.observable(Theme.SYSTEM) { _, old, new ->
        if (old != new) {
            viewModelScope.launch { preferences.saveTheme(new) }
        }
    }
}
```

### by map — property delegation to a Map (for dynamic config)

```kotlin
// ✅ Delegate properties to a map — useful for feature flags
class FeatureFlags(private val flags: Map<String, Any>) {
    val darkMode: Boolean by flags
    val maxScans: Int by flags
    val betaEnabled: Boolean by flags
}

val flags = FeatureFlags(mapOf(
    "darkMode" to true,
    "maxScans" to 10,
    "betaEnabled" to false
))
```

### Class delegation — implement interface via delegate

```kotlin
// ✅ Implement an interface by delegating to another instance
interface Logger {
    fun log(message: String)
    fun error(message: String)
}

class TimberLogger : Logger {
    override fun log(message: String) = Timber.d(message)
    override fun error(message: String) = Timber.e(message)
}

// ViewModel delegates Logger implementation to TimberLogger
class ScanViewModel @Inject constructor(
    private val repository: ScanRepository,
    logger: Logger = TimberLogger()
) : ViewModel(), Logger by logger {   // ← all Logger calls delegated to logger
    fun solve() {
        log("Starting solve")   // ← calls TimberLogger.log
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Eager initialization of expensive objects at class level
class WrongViewModel : ViewModel() {
    // Created immediately when ViewModel is instantiated, even if never used
    private val expensiveAnalytics = ExpensiveAnalyticsClient()  // ❌
}
// ✅ by lazy

// ❌ Manual observable pattern — boilerplate that Kotlin handles
private var _theme = Theme.SYSTEM
var theme: Theme
    get() = _theme
    set(value) {
        _theme = value
        onThemeChanged(value)   // ❌ manual, error-prone
    }
// ✅ by Delegates.observable

// ❌ Thread-unsafe lazy in multithreaded context
// Default lazy is SYNCHRONIZED — correct for most cases
// Only use NONE if you're certain access is single-threaded
private val resource by lazy(LazyThreadSafetyMode.NONE) {
    DatabaseClient()   // ❌ if accessed from multiple threads, use default lazy
}
```
