# Database Queries — Select, Insert, Upsert, RPC

**Impact: HIGH**

Wrong query patterns cause runtime crashes from missing @Serializable,
incorrect filter syntax, or forgetting to run on IO dispatcher.

## Rule

### 1. Select queries

```kotlin
// ✅ Select all rows for current user
val questions = supabase.from("questions")
    .select {
        filter { eq("user_id", userId) }
        order("created_at", Order.DESCENDING)
        limit(20)
    }
    .decodeList<Question>()

// ✅ Select single row
val question = supabase.from("questions")
    .select { filter { eq("id", questionId) } }
    .decodeSingle<Question>()

// ✅ Select with multiple filters
val results = supabase.from("scan_history")
    .select {
        filter {
            eq("user_id", userId)
            eq("subject", "Math")
            gte("created_at", startDate)
        }
    }
    .decodeList<ScanHistory>()
```

### 2. Insert and Upsert

```kotlin
// ✅ Insert single row
supabase.from("scan_history").insert(
    mapOf(
        "user_id"  to userId,
        "question" to questionText,
        "answer"   to answer,
        "subject"  to subject
    )
)

// ✅ Insert with serializable data class
@Serializable
data class ScanHistoryInsert(
    @SerialName("user_id")  val userId: String,
    val question: String,
    val answer: String
)
supabase.from("scan_history").insert(ScanHistoryInsert(userId, question, answer))

// ✅ Upsert — insert or update on conflict
supabase.from("user_preferences").upsert(
    UserPreferences(userId = userId, theme = "dark"),
    onConflict = "user_id"   // ← column to check for conflict
)

// ✅ Update
supabase.from("questions")
    .update({ set("is_solved", true) })
    { filter { eq("id", questionId) } }

// ✅ Delete
supabase.from("scan_history")
    .delete { filter { eq("id", historyId) } }
```

### 3. RPC calls

```kotlin
// ✅ Call a Postgres function
val result = supabase.postgrest.rpc(
    function = "check_scan_quota",
    parameters = buildJsonObject {
        put("p_user_id",     userId)
        put("p_period_type", "daily")
        put("p_free_limit",  5)
    }
).decodeAs<QuotaResult>()

@Serializable
data class QuotaResult(
    val success: Boolean,
    @SerialName("remaining_scans") val remainingScans: Int,
    @SerialName("error_message")   val errorMessage: String? = null,
    @SerialName("error_code")      val errorCode: String? = null
)
```

### 4. Always run on IO dispatcher in Repository

```kotlin
// ✅ Repository wraps Supabase calls in withContext(Dispatchers.IO)
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {

    override suspend fun getQuestions(userId: String): List<Question> =
        withContext(ioDispatcher) {
            supabase.from("questions")
                .select { filter { eq("user_id", userId) } }
                .decodeList()
        }
}
```

## Anti-Patterns

```kotlin
// ❌ Missing @Serializable — crashes at runtime with SerializationException
data class Question(val id: String)  // ❌ not serializable
// ✅
@Serializable data class Question(val id: String)

// ❌ Calling Supabase directly from ViewModel — wrong thread, no separation
class WrongViewModel : ViewModel() {
    fun load() = viewModelScope.launch {
        supabase.from("questions").select().decodeList<Question>()  // ❌ in VM
    }
}

// ❌ Missing SerialName for snake_case columns — null fields
@Serializable
data class Question(val userId: String)  // ❌ DB column is "user_id" — will be null
// ✅
@Serializable
data class Question(@SerialName("user_id") val userId: String)
```
