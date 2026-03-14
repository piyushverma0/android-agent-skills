# Data Models — DTOs, Domain Models, UI Models, Mappers

**Impact: HIGH**

Using a single model class for all layers forces UI presentation concerns into
domain logic and API schema changes into the UI layer. Each layer needs its own model.

## Rule

### Three model types — one per layer

```kotlin
// ── Layer 1: DTO (Data Transfer Object) — data layer ─────────────────────
// Matches API/DB schema exactly. @Serializable. Can be ugly.
@Serializable
data class QuestionDto(
    val id: String,
    @SerialName("question_text") val questionText: String,
    val subject: String,
    val difficulty: String,
    @SerialName("user_id")    val userId: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("is_solved")  val isSolved: Boolean = false,
    @SerialName("image_url")  val imageUrl: String? = null
)

// ── Layer 2: Domain Model — domain layer ──────────────────────────────────
// Pure Kotlin. No framework imports. Represents business concepts.
data class Question(
    val id: String,
    val text: String,
    val subject: Subject,           // ← typed enum, not raw String
    val difficulty: Difficulty,     // ← typed enum, not raw String
    val userId: String,
    val createdAt: LocalDateTime,   // ← typed date, not raw String
    val isSolved: Boolean,
    val imageUrl: String?
)

enum class Subject { MATH, PHYSICS, CHEMISTRY, GENERAL, QUIZ }
enum class Difficulty { EASY, MEDIUM, HARD }

// ── Layer 3: UI Model — ui layer ──────────────────────────────────────────
// Formatted for display. Contains presentation strings, colors, icons.
data class QuestionDisplayItem(
    val id: String,
    val text: String,
    val subjectLabel: String,           // "Mathematics" (localized)
    val difficultyLabel: String,        // "Medium"
    val difficultyColor: Color,         // Color(0xFFE65100)
    val timeAgoLabel: String,           // "2 hours ago"
    val isSolved: Boolean,
    val solvedBadgeVisible: Boolean
)
```

### Mappers — convert between layers

```kotlin
// data/mapper/QuestionMapper.kt
// ✅ DTO → Domain (in data layer)
fun QuestionDto.toDomain() = Question(
    id         = id,
    text       = questionText,
    subject    = Subject.fromString(subject),
    difficulty = Difficulty.fromString(difficulty),
    userId     = userId,
    createdAt  = LocalDateTime.parse(createdAt),
    isSolved   = isSolved,
    imageUrl   = imageUrl
)

// Reverse: Domain → DTO (for inserts)
fun Question.toDto() = QuestionDto(
    id          = id,
    questionText = text,
    subject     = subject.apiValue,
    difficulty  = difficulty.apiValue,
    userId      = userId,
    createdAt   = createdAt.toString(),
    isSolved    = isSolved,
    imageUrl    = imageUrl
)

// ui/mapper/QuestionUiMapper.kt
// ✅ Domain → UI Model (in ui layer)
fun Question.toDisplayItem(context: Context) = QuestionDisplayItem(
    id              = id,
    text            = text,
    subjectLabel    = context.getString(subject.labelRes),
    difficultyLabel = difficulty.label,
    difficultyColor = difficulty.color,
    timeAgoLabel    = createdAt.toRelativeTimeString(),
    isSolved        = isSolved,
    solvedBadgeVisible = isSolved
)

// ✅ Extension on LocalDateTime — utility in ui layer
fun LocalDateTime.toRelativeTimeString(): String {
    val now = LocalDateTime.now()
    val hours = ChronoUnit.HOURS.between(this, now)
    return when {
        hours < 1  -> "Just now"
        hours < 24 -> "$hours hours ago"
        else       -> "${ChronoUnit.DAYS.between(this, now)} days ago"
    }
}
```

### enum class with API values and display values

```kotlin
// ✅ Enums carry their mapping logic
enum class Subject(val apiValue: String, val labelRes: Int) {
    MATH      ("math",      R.string.subject_math),
    PHYSICS   ("physics",   R.string.subject_physics),
    CHEMISTRY ("chemistry", R.string.subject_chemistry),
    GENERAL   ("general",   R.string.subject_general),
    QUIZ      ("quiz",      R.string.subject_quiz);

    companion object {
        fun fromString(value: String) =
            entries.find { it.apiValue == value } ?: GENERAL
    }
}

enum class Difficulty(val apiValue: String, val label: String, val color: Color) {
    EASY  ("easy",   "Easy",   Color(0xFF2E7D32)),
    MEDIUM("medium", "Medium", Color(0xFFE65100)),
    HARD  ("hard",   "Hard",   Color(0xFFC62828));

    companion object {
        fun fromString(value: String) =
            entries.find { it.apiValue == value } ?: MEDIUM
    }
}
```

## Anti-Patterns

```kotlin
// ❌ Single model for all layers — API schema changes break UI
@Serializable
data class Question(
    @SerialName("question_text") val questionText: String,  // ← API field in domain model
    val createdAt: String,         // ← raw String instead of LocalDateTime
    val difficultyColor: Color     // ← UI concern in domain model
)

// ❌ Raw String for typed values — no compile-time safety
data class Question(
    val subject: String,     // ❌ "math" vs "Math" vs "MATH" — inconsistent
    val difficulty: String   // ❌ subject-to-color mapping scattered everywhere
)

// ❌ Mapping in ViewModel — wrong layer
class WrongViewModel : ViewModel() {
    fun loadQuestions() = viewModelScope.launch {
        val dtos = repository.getQuestions()
        val domain = dtos.map { it.toDomain() }  // ❌ DTO→Domain belongs in Repository
    }
}
```
