---
name: offline-first
description: |
  Offline-first architecture for Android AI agents. Use this skill whenever the app needs
  to work without internet, implementing cache-first strategy, local-first data, sync
  architecture, optimistic UI updates, conflict resolution, network connectivity monitoring,
  WorkManager background sync, retry logic, pending operations queue, stale-while-revalidate,
  or any pattern where local data is the source of truth and network data is synced.
  Triggers on: offline, cache, sync, local-first, network unavailable, background sync,
  WorkManager, ConnectivityManager, no internet, optimistic update.
---

# Offline-First Architecture

Apps that require internet to work lose 30%+ of users. These patterns make your app work
everywhere — with or without connectivity.

## Core principle: Local DB is source of truth

```
User Action → ViewModel → Repository
                               ↓
                         Local DB (Room)  ← single source of truth
                               ↓
                          UI observes Flow from Room
                               ↓ (background)
                         Network sync → update Local DB → UI auto-updates
```

## Rule 1: Single-direction data flow — never mix local + remote in UI

```kotlin
// ✅ Repository: local DB is source of truth, network updates DB silently
class ItemRepositoryImpl @Inject constructor(
    private val itemDao: ItemDao,
    private val api: ItemApiService,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) : ItemRepository {

    // UI always observes local DB
    override fun getItemsStream(): Flow<List<Item>> =
        itemDao.getAll().map { it.map { entity -> entity.toDomain() } }

    // Sync pulls from network and updates local DB
    override suspend fun sync(): Result<Unit> = withContext(dispatcher) {
        runCatching {
            val remoteItems = api.getItems()
            itemDao.upsertAll(remoteItems.map { it.toEntity() })
        }
    }
}

// ✅ ViewModel triggers sync but observes local DB
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: ItemRepository
) : ViewModel() {

    val items: StateFlow<List<Item>> = repository.getItemsStream()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init { sync() }

    fun sync() {
        viewModelScope.launch {
            repository.sync()   // updates DB → Flow auto-updates UI
        }
    }
}
```

## Rule 2: Optimistic UI updates

```kotlin
// ✅ Apply change locally immediately, sync to server in background
override suspend fun toggleFavorite(itemId: String): Result<Unit> = withContext(dispatcher) {
    // 1. Update local DB immediately (UI updates instantly)
    val item = itemDao.getByIdOnce(itemId) ?: return@withContext Result.failure(NotFoundException())
    val newValue = !item.isFavorite
    itemDao.updateFavorite(itemId, newValue)

    // 2. Sync to server in background
    runCatching {
        api.patchItem(itemId, mapOf("is_favorite" to newValue))
    }.onFailure {
        // 3. Rollback local change if server fails
        itemDao.updateFavorite(itemId, !newValue)
    }
}
```

## Rule 3: Network connectivity monitoring

```kotlin
// ✅ Observable connectivity status
class NetworkMonitor @Inject constructor(
    @ApplicationContext private val context: Context
) {
    val isOnline: Flow<Boolean> = callbackFlow {
        val connectivityManager = context.getSystemService<ConnectivityManager>()!!

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { trySend(true) }
            override fun onLost(network: Network) { trySend(false) }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, callback)
        // Emit current state immediately
        trySend(connectivityManager.isCurrentlyConnected())

        awaitClose { connectivityManager.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()
        .shareIn(CoroutineScope(Dispatchers.IO), SharingStarted.WhileSubscribed(), 1)

    private fun ConnectivityManager.isCurrentlyConnected(): Boolean =
        activeNetwork?.let { getNetworkCapabilities(it) }
            ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
}

// ✅ In ViewModel — sync when connection is restored
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: ItemRepository,
    private val networkMonitor: NetworkMonitor
) : ViewModel() {
    init {
        viewModelScope.launch {
            networkMonitor.isOnline
                .filter { it }       // only emit when online
                .collect { repository.sync() }
        }
    }
}
```

## Rule 4: WorkManager for background sync

```kotlin
// ✅ Periodic sync with WorkManager
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: ItemRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            repository.sync().fold(
                onSuccess = { Result.success() },
                onFailure = {
                    if (runAttemptCount < 3) Result.retry()
                    else Result.failure()
                }
            )
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val WORK_NAME = "SyncWorker"

        fun schedule(workManager: WorkManager) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<SyncWorker>(
                repeatInterval = 15,
                repeatIntervalTimeUnit = TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build()

            workManager.enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }
}
```

## Rule 5: Pending operations queue — for offline writes

```kotlin
// ✅ Store operations when offline, replay when online
@Entity(tableName = "pending_operations")
data class PendingOperationEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "operation_type") val operationType: String,   // "CREATE", "UPDATE", "DELETE"
    @ColumnInfo(name = "entity_id") val entityId: String,
    @ColumnInfo(name = "payload") val payload: String,                // JSON-serialized request
    @ColumnInfo(name = "created_at") val createdAt: Long = System.currentTimeMillis(),
    @ColumnInfo(name = "retry_count") val retryCount: Int = 0
)

// ✅ Repository queues when offline
override suspend fun createItem(item: Item): Result<Unit> = withContext(dispatcher) {
    // Always save locally first
    itemDao.upsert(item.toEntity())

    // Try to sync immediately
    if (networkMonitor.isCurrentlyOnline()) {
        runCatching { api.createItem(item.toRequest()) }
            .onFailure {
                // Queue for later retry
                pendingOpsDao.insert(PendingOperationEntity(
                    operationType = "CREATE",
                    entityId = item.id,
                    payload = Json.encodeToString(item.toRequest())
                ))
            }
    } else {
        // Offline — queue immediately
        pendingOpsDao.insert(PendingOperationEntity(
            operationType = "CREATE",
            entityId = item.id,
            payload = Json.encodeToString(item.toRequest())
        ))
    }

    Result.success(Unit)
}
```

## Rule 6: Stale data indicator

```kotlin
// ✅ Show "last synced" to inform users of data freshness
data class SyncMetadata(
    val lastSyncTime: Instant?,
    val isSyncing: Boolean,
    val syncError: String?
)

@HiltViewModel
class HomeViewModel : ViewModel() {
    private val _syncMetadata = MutableStateFlow(SyncMetadata(null, false, null))
    val syncMetadata: StateFlow<SyncMetadata> = _syncMetadata.asStateFlow()

    private fun sync() {
        viewModelScope.launch {
            _syncMetadata.update { it.copy(isSyncing = true, syncError = null) }
            repository.sync()
                .onSuccess {
                    _syncMetadata.update { it.copy(
                        isSyncing = false,
                        lastSyncTime = Clock.System.now()
                    ) }
                }
                .onFailure { error ->
                    _syncMetadata.update { it.copy(
                        isSyncing = false,
                        syncError = "Last sync failed. Showing cached data."
                    ) }
                }
        }
    }
}
```

## Common Mistakes

❌ Showing loading while Room DB loads — DB is fast, show data immediately
❌ UI observing network response directly — UI must only observe local DB
❌ No retry logic for failed sync — use exponential backoff
❌ Running WorkManager sync on unconstrained network — always require CONNECTED
❌ Not handling sync conflicts — decide on server-wins or last-write-wins policy
❌ Clearing local cache on every fresh load — breaks offline experience
