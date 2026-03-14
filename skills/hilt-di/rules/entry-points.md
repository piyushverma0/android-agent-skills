# @EntryPoint — Inject into Non-Hilt Classes

**Impact: HIGH**

Some Android classes (custom Views, ContentProviders, BroadcastReceivers,
non-Hilt WorkManager workers) cannot receive `@Inject` directly.
`@EntryPoint` bridges them to the Hilt graph.

## Rule

### 1. Basic @EntryPoint usage

```kotlin
// ✅ Step 1: Declare an entry point interface
@EntryPoint
@InstallIn(SingletonComponent::class)
interface AnalyticsEntryPoint {
    fun analyticsTracker(): AnalyticsTracker
    fun userRepository(): UserRepository
}

// ✅ Step 2: Access it from any context
class MyCustomView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    private val analytics: AnalyticsTracker by lazy {
        EntryPointAccessors.fromApplication(
            context.applicationContext,
            AnalyticsEntryPoint::class.java
        ).analyticsTracker()
    }
}
```

### 2. Entry point for each component level

```kotlin
// ✅ Singleton — access from Application context
@EntryPoint
@InstallIn(SingletonComponent::class)
interface AppEntryPoint {
    fun scanRepository(): ScanRepository
}
val repo = EntryPointAccessors
    .fromApplication(context.applicationContext, AppEntryPoint::class.java)
    .scanRepository()

// ✅ Activity — access from Activity context
@EntryPoint
@InstallIn(ActivityComponent::class)
interface ActivityEntryPoint {
    fun navigationManager(): NavigationManager
}
val nav = EntryPointAccessors
    .fromActivity(activity, ActivityEntryPoint::class.java)
    .navigationManager()

// ✅ Fragment — access from Fragment
@EntryPoint
@InstallIn(FragmentComponent::class)
interface FragmentEntryPoint {
    fun fragmentAnalytics(): FragmentAnalytics
}
val analytics = EntryPointAccessors
    .fromFragment(fragment, FragmentEntryPoint::class.java)
    .fragmentAnalytics()
```

### 3. ContentProvider — common use case

```kotlin
// ✅ ContentProvider cannot use @AndroidEntryPoint — use @EntryPoint instead
@EntryPoint
@InstallIn(SingletonComponent::class)
interface ContentProviderEntryPoint {
    fun database(): AppDatabase
}

class MyContentProvider : ContentProvider() {
    private val database: AppDatabase by lazy {
        EntryPointAccessors.fromApplication(
            requireNotNull(context).applicationContext,
            ContentProviderEntryPoint::class.java
        ).database()
    }

    override fun onCreate(): Boolean {
        // database is ready — initialized lazily
        return true
    }
}
```

### 4. BroadcastReceiver

```kotlin
// ✅ BroadcastReceiver — use @EntryPoint (not @AndroidEntryPoint, which isn't supported)
@EntryPoint
@InstallIn(SingletonComponent::class)
interface ReceiverEntryPoint {
    fun notificationManager(): NotificationManager
}

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationManager = EntryPointAccessors
            .fromApplication(context.applicationContext, ReceiverEntryPoint::class.java)
            .notificationManager()
        notificationManager.showAlarm()
    }
}
```

## When to Use @EntryPoint vs @AndroidEntryPoint

| Class | Use |
|---|---|
| Activity, Fragment, Service | `@AndroidEntryPoint` |
| ContentProvider | `@EntryPoint` + `EntryPointAccessors.fromApplication` |
| BroadcastReceiver | `@EntryPoint` + `EntryPointAccessors.fromApplication` |
| Custom View | `@EntryPoint` + `EntryPointAccessors.fromApplication` |
| Non-Hilt WorkManager | `@EntryPoint` or use `@HiltWorker` |

## Anti-Patterns

```kotlin
// ❌ @AndroidEntryPoint on ContentProvider — not supported
@AndroidEntryPoint
class MyContentProvider : ContentProvider()  // ❌ compile error

// ❌ Passing dependencies via constructor to non-Hilt classes
class MyView(context: Context, private val repo: ScanRepository) : View(context)
// ❌ View constructors have fixed signatures — use @EntryPoint instead

// ❌ Getting entry point from wrong context level
EntryPointAccessors.fromApplication(
    activityContext,      // ❌ must be applicationContext for SingletonComponent
    MyEntryPoint::class.java
)
// ✅
EntryPointAccessors.fromApplication(
    context.applicationContext,
    MyEntryPoint::class.java
)
```
