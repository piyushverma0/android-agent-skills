# Coroutine Dispatchers — Use the Right Thread

**Impact: CRITICAL**

Running network or database work on `Dispatchers.Main` causes ANR crashes.
Running CPU work on `Dispatchers.IO` wastes the thread pool.
Every suspend function in a Repository must specify its dispatcher.

## Rule

```kotlin
// ✅ Dispatchers.IO — network, file I/O, database reads/writes
// Thread pool sized for blocking I/O (64 threads by default)
override suspend fun getQuestions(): List<Question> =
    withContext(Dispatchers.IO) {
        supabase.from("questions").select().decodeList()
    }

// ✅ Dispatchers.Default — CPU-intensive work
// Thread pool sized for CPU cores
val sorted = withContext(Dispatchers.Default) {
    questions.sortedWith(compareBy({ it.subject }, { it.difficulty }))
}

// ✅ Dispatchers.Main — UI updates (rarely needed in Compose — StateFlow handles this)
withContext(Dispatchers.Main) {
    binding.progressBar.isVisible = false
}

// ✅ Dispatchers.Main.immediate — avoids unnecessary thread switch when already on Main
withContext(Dispatchers.Main.immediate) {
    // No dispatch if already on main thread
}
```

### Inject dispatcher for testability

```kotlin
// ✅ Inject dispatcher — allows replacing with TestCoroutineDispatcher in tests
@Module @InstallIn(SingletonComponent::class)
object DispatcherModule {
    @Provides @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides @DefaultDispatcher
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default
}

@Qualifier @Retention(AnnotationRetention.BINARY) annotation class IoDispatcher
@Qualifier @Retention(AnnotationRetention.BINARY) annotation class DefaultDispatcher

// In Repository
class ScanRepositoryImpl @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {
    override suspend fun getQuestions() = withContext(ioDispatcher) {
        supabase.from("questions").select().decodeList<Question>()
    }
}

// In test
val repository = ScanRepositoryImpl(ioDispatcher = UnconfinedTestDispatcher())
```

### Parallel execution

```kotlin
// ✅ async/await for parallel independent calls — faster than sequential
suspend fun loadDashboard(userId: String) = coroutineScope {
    val questionsDeferred = async { repository.getQuestions(userId) }
    val profileDeferred   = async { repository.getProfile(userId) }
    val quotaDeferred     = async { repository.getQuota(userId) }

    DashboardData(
        questions = questionsDeferred.await(),
        profile   = profileDeferred.await(),
        quota     = quotaDeferred.await()
    )
}

// ✅ Sequential when second call depends on first
suspend fun loadAndEnrich(questionId: String): EnrichedQuestion {
    val question = repository.getQuestion(questionId)       // must complete first
    val similar  = repository.getSimilar(question.topic)    // uses result of first
    return EnrichedQuestion(question, similar)
}
```

## Anti-Patterns

```kotlin
// ❌ Network on Main thread — NetworkOnMainThreadException / ANR
viewModelScope.launch {
    // Default dispatcher is Main in ViewModel — this crashes
    val questions = supabase.from("questions").select().decodeList<Question>()
}
// ✅ Always withContext(Dispatchers.IO) for network

// ❌ launch(Dispatchers.IO) in ViewModel — bypasses Repository layer
viewModelScope.launch(Dispatchers.IO) {
    supabase.from("questions").select()  // ❌ network in ViewModel
}
// ✅ Repository handles the dispatcher

// ❌ Hardcoded Dispatchers — untestable
class Repo { suspend fun load() = withContext(Dispatchers.IO) { ... } }
// ✅ Inject dispatcher
```
