# @HiltWorker — WorkManager with Dependency Injection

**Impact: MEDIUM**

WorkManager workers cannot use `@AndroidEntryPoint`. Without `@HiltWorker`,
you can't inject dependencies into background workers.

## Rule

### 1. @HiltWorker setup

```kotlin
// ✅ Worker — annotate with @HiltWorker, inject with @AssistedInject
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncRepository: SyncRepository,          // ← injected by Hilt
    private val notificationManager: NotificationManager // ← injected by Hilt
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            syncRepository.syncAll()
            Result.success()
        } catch (e: Exception) {
            Timber.e(e, "Sync failed")
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val WORK_NAME = "sync_worker"

        fun buildRequest(): PeriodicWorkRequest =
            PeriodicWorkRequestBuilder<SyncWorker>(1, TimeUnit.HOURS)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build()
                )
                .build()
    }
}
```

### 2. HiltWorkerFactory in Application

```kotlin
// ✅ Register HiltWorkerFactory — required for @HiltWorker to work
@HiltAndroidApp
class MyApplication : Application(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}
```

```xml
<!-- AndroidManifest.xml — disable default WorkManager init -->
<provider
    android:name="androidx.startup.InitializationProvider"
    android:authorities="${applicationId}.androidx-startup"
    android:exported="false"
    tools:node="merge">
    <meta-data
        android:name="androidx.work.WorkManagerInitializer"
        android:value="androidx.startup"
        tools:node="remove" />   <!-- ← remove default init so Hilt factory is used -->
</provider>
```

### 3. Enqueue work from ViewModel

```kotlin
// ✅ Enqueue from ViewModel using WorkManager
@HiltViewModel
class SyncViewModel @Inject constructor(
    private val workManager: WorkManager
) : ViewModel() {

    fun scheduleSyncNow() {
        val request = OneTimeWorkRequestBuilder<SyncWorker>()
            .setInputData(workDataOf("force" to true))
            .build()
        workManager.enqueueUniqueWork(
            SyncWorker.WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            request
        )
    }

    val syncStatus: LiveData<WorkInfo?> =
        workManager.getWorkInfosForUniqueWorkLiveData(SyncWorker.WORK_NAME)
            .map { it.firstOrNull() }
}
```

### 4. Required dependency

```kotlin
// build.gradle.kts
implementation("androidx.hilt:hilt-work:1.2.0")
ksp("androidx.hilt:hilt-compiler:1.2.0")   // ← in addition to hilt-android-compiler
```

## Anti-Patterns

```kotlin
// ❌ @AndroidEntryPoint on Worker — not supported
@AndroidEntryPoint
class WrongWorker(context: Context, params: WorkerParameters) : Worker(context, params)
// ❌ use @HiltWorker + @AssistedInject

// ❌ Missing HiltWorkerFactory in Application — workers get no injection
@HiltAndroidApp
class WrongApp : Application()
// ❌ missing Configuration.Provider + HiltWorkerFactory injection

// ❌ @Inject constructor instead of @AssistedInject
@HiltWorker
class WrongWorker @Inject constructor(   // ❌ must be @AssistedInject
    @Assisted context: Context,
    @Assisted params: WorkerParameters
) : Worker(context, params)
```
