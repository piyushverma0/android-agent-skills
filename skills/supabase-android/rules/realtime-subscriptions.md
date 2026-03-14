# Realtime Subscriptions — Lifecycle-Aware Setup

**Impact: HIGH**

Realtime subscriptions that aren't cleaned up in `onCleared()` leak connections.
Multiple `connect()` calls without `disconnect()` cause duplicate event delivery.

## Rule

```kotlin
// ✅ Realtime subscription in ViewModel — connect, subscribe, clean up
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val supabase: SupabaseClient,
    private val authRepository: AuthRepository
) : ViewModel() {

    private var realtimeChannel: RealtimeChannel? = null

    init {
        observeScanResults()
    }

    private fun observeScanResults() {
        viewModelScope.launch {
            val userId = authRepository.currentUserId() ?: return@launch

            supabase.realtime.connect()

            realtimeChannel = supabase.channel("scan-results-$userId")

            realtimeChannel!!
                .postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
                    table  = "scan_results"
                    filter = "user_id=eq.$userId"    // ← filter to current user only
                }
                .onEach { change ->
                    val newResult = change.record.decodeRecord<ScanResult>()
                    _uiState.update { it.copy(latestResult = newResult) }
                }
                .launchIn(viewModelScope)

            realtimeChannel!!.subscribe()
        }
    }

    // ✅ Always clean up on ViewModel cleared
    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch {
            realtimeChannel?.unsubscribe()
            supabase.realtime.disconnect()
        }
    }
}
```

### Broadcast channel (for presence / live collaboration)

```kotlin
// ✅ Broadcast — send and receive custom events
val channel = supabase.channel("room-$roomId")

// Receive
channel.broadcastFlow<UserTypingEvent>(event = "typing")
    .onEach { event -> _uiState.update { it.copy(typingUser = event.userId) } }
    .launchIn(viewModelScope)

// Send
channel.broadcast(event = "typing", payload = UserTypingEvent(userId = currentUserId))

channel.subscribe()
```

### Postgres change types

```kotlin
// Insert — new row added
channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
    table = "messages"
}.onEach { change -> handleInsert(change.record.decodeRecord<Message>()) }

// Update — row modified
channel.postgresChangeFlow<PostgresAction.Update>(schema = "public") {
    table = "messages"
}.onEach { change -> handleUpdate(change.record.decodeRecord<Message>()) }

// Delete — row removed
channel.postgresChangeFlow<PostgresAction.Delete>(schema = "public") {
    table = "messages"
}.onEach { change -> handleDelete(change.oldRecord.decodeRecord<MessageId>()) }

// All changes
channel.postgresChangeFlow<PostgresAction>(schema = "public") {
    table = "messages"
}.onEach { change ->
    when (change) {
        is PostgresAction.Insert -> handleInsert(change.record.decodeRecord())
        is PostgresAction.Update -> handleUpdate(change.record.decodeRecord())
        is PostgresAction.Delete -> handleDelete(change.oldRecord.decodeRecord())
        else -> {}
    }
}
```

## Anti-Patterns

```kotlin
// ❌ No cleanup — connection leaks after ViewModel is cleared
@HiltViewModel
class WrongViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            supabase.realtime.connect()
            supabase.channel("data").subscribe()
            // ❌ no onCleared() cleanup
        }
    }
}

// ❌ Calling connect() multiple times without disconnect — duplicate events
fun refresh() {
    supabase.realtime.connect()   // ❌ called again without disconnecting first
    supabase.channel("data").subscribe()
}

// ❌ No user filter — receives events from ALL users' rows (security issue)
channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
    table = "scan_results"
    // ❌ missing filter — receives all users' inserts
}
```
