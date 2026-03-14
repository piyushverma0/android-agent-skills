# Null Safety — Safe Calls, Elvis, requireNotNull

**Impact: HIGH**

The `!!` operator trades a NullPointerException at the call site for a crash
with no context. Every `!!` in production code is a crash waiting to happen.

## Rule

### 1. Never use !! — use safe alternatives

```kotlin
// ❌ !! — crashes with NullPointerException, no context about what was null
val userId = session!!.user!!.id!!

// ✅ Safe call chain — returns null if anything is null
val userId = session?.user?.id

// ✅ Elvis with fallback
val userId = session?.user?.id ?: return   // early return from function
val userId = session?.user?.id ?: ""       // fallback value
val userId = session?.user?.id ?: throw IllegalStateException("No authenticated user")

// ✅ requireNotNull — crashes with a meaningful message (only for programming errors)
val config = requireNotNull(BuildConfig.API_KEY) { "API_KEY missing in local.properties" }

// ✅ checkNotNull — same as requireNotNull but for state invariants
val channel = checkNotNull(realtimeChannel) { "Channel not initialized — call connect() first" }
```

### 2. let for nullable operations

```kotlin
// ✅ let — executes block only if non-null
user?.let { nonNullUser ->
    analytics.setUserId(nonNullUser.id)
    analytics.setUserName(nonNullUser.name)
}

// ✅ let with Elvis for fallback
val greeting = user?.let { "Hello, ${it.name}" } ?: "Hello, guest"

// ✅ Chained let
session?.user?.id?.let { userId ->
    loadProfile(userId)
}
```

### 3. Elvis for early return and default

```kotlin
// ✅ Early return from suspend function
suspend fun solve(questionId: String) {
    val question = repository.getQuestion(questionId) ?: return
    val userId   = auth.currentUserOrNull()?.id ?: return
    processAndSave(question, userId)
}

// ✅ Elvis in data transformation
fun formatName(user: User?): String =
    user?.let { "${it.firstName} ${it.lastName}".trim() } ?: "Unknown"

// ✅ Safe navigation into nested nullable
val avatarUrl = response.data?.user?.profile?.avatarUrl ?: defaultAvatarUrl
```

### 4. lateinit — only for non-null dependencies injected after construction

```kotlin
// ✅ lateinit for dependency injection (Hilt/Dagger @Inject)
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject lateinit var analytics: AnalyticsTracker  // ← injected before use
}

// ❌ Never use lateinit for nullable types
lateinit var name: String?   // ❌ won't compile — use nullable directly

// ❌ Never use lateinit when value might not be set before use
class WrongUsage {
    lateinit var result: String
    fun process() { println(result) }  // ❌ UninitializedPropertyAccessException if called early
}
```

### 5. Nullable vs non-null in function signatures

```kotlin
// ✅ Return null only when absence is meaningful
fun findQuestion(id: String): Question?      // null = not found, valid state
fun getQuestions(): List<Question>           // empty list, never null

// ✅ Accept null parameters only when truly optional
fun formatDate(date: LocalDate?, pattern: String = "MMM dd"): String =
    date?.format(DateTimeFormatter.ofPattern(pattern)) ?: "No date"

// ❌ Returning null when exception is more appropriate
fun divide(a: Int, b: Int): Int? =
    if (b == 0) null else a / b   // ❌ use require(b != 0) instead
```

## Anti-Patterns

```kotlin
// ❌ !! anywhere in production code
view!!.visibility = View.GONE
(context as Activity)!!.finish()

// ❌ Catching NullPointerException — band-aid over !! usage
try { doSomething(value!!) } catch (e: NullPointerException) { }

// ❌ Java-style null check
if (user != null) {
    val id = user.id   // ❌ smart cast may fail if user is a var
}
// ✅
user?.let { id = it.id }
// ✅ or with val
val currentUser = user
if (currentUser != null) {
    val id = currentUser.id   // ← smart cast works on val
}
```
