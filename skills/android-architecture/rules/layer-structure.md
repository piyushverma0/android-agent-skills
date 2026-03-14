# Layer Structure — Data, Domain, UI

**Impact: CRITICAL**

Mixing concerns across layers — putting network calls in ViewModels, domain
logic in composables, or Android imports in domain models — creates code that
is impossible to test, reuse, or maintain.

## Rule

### The three layers and what belongs in each

```
app/
├── data/                        ← Knows HOW to get data
│   ├── model/                   ← DTOs: @Serializable classes matching API/DB schema
│   ├── remote/                  ← Data sources: Supabase, Retrofit, REST calls
│   ├── local/                   ← Room DAOs, SharedPreferences, DataStore
│   ├── repository/              ← Repository implementations
│   └── mapper/                  ← DTO → Domain model conversions
│
├── domain/                      ← Knows WHAT the app does (pure Kotlin, zero Android deps)
│   ├── model/                   ← Domain models: pure data classes, no framework deps
│   ├── repository/              ← Repository interfaces (no implementation)
│   └── usecase/                 ← Business logic (only when shared or complex)
│
└── ui/                          ← Knows HOW to show data
    ├── screens/                 ← One folder per screen
    │   └── scan/
    │       ├── ScanScreen.kt    ← @Composable — only UI, no business logic
    │       └── ScanViewModel.kt ← StateFlow, events, delegates to Repository
    ├── components/              ← Reusable composables (QuestionCard, DifficultyBadge)
    ├── navigation/              ← NavGraph, Screen sealed class
    └── theme/                   ← MaterialTheme, colors, typography
```

### Dependency rule — dependencies only point inward

```
UI → Domain ← Data
```

- `ui` depends on `domain` — uses interfaces, domain models
- `data` depends on `domain` — implements interfaces, maps to domain models
- `domain` depends on NOTHING — pure Kotlin, no Android, no framework imports

### What belongs in each layer

```kotlin
// ✅ data/model — matches API/DB schema exactly
@Serializable
data class QuestionDto(
    val id: String,
    @SerialName("question_text") val questionText: String,
    val subject: String,
    @SerialName("created_at") val createdAt: String
)

// ✅ domain/model — pure Kotlin, no framework
data class Question(
    val id: String,
    val text: String,
    val subject: Subject,
    val createdAt: LocalDateTime
)

// ✅ data/mapper — DTO → Domain
fun QuestionDto.toDomain() = Question(
    id = id,
    text = questionText,
    subject = Subject.fromString(subject),
    createdAt = LocalDateTime.parse(createdAt)
)

// ✅ domain/repository — interface only, no imports from data layer
interface QuestionRepository {
    suspend fun getQuestions(userId: String): Result<List<Question>>
    fun observeQuestions(userId: String): Flow<List<Question>>
}

// ✅ data/repository — implementation only in data layer
class QuestionRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : QuestionRepository {
    override suspend fun getQuestions(userId: String): Result<List<Question>> =
        withContext(ioDispatcher) {
            runCatching {
                supabase.from("questions")
                    .select { filter { eq("user_id", userId) } }
                    .decodeList<QuestionDto>()
                    .map { it.toDomain() }
            }
        }
}
```

## Anti-Patterns

```kotlin
// ❌ Network call in ViewModel — wrong layer
@HiltViewModel
class WrongViewModel : ViewModel() {
    fun load() = viewModelScope.launch {
        supabase.from("questions").select().decodeList<Question>()  // ❌ data layer in UI layer
    }
}

// ❌ Android import in domain model
data class Question(
    val id: String,
    val bitmap: Bitmap   // ❌ Android framework dep in domain — can't unit test
)

// ❌ UI logic in Repository
class WrongRepository : QuestionRepository {
    override suspend fun getQuestions(userId: String): Result<List<Question>> {
        Toast.makeText(context, "Loading...", Toast.LENGTH_SHORT).show()  // ❌ UI in data layer
        return runCatching { ... }
    }
}
```
