# Data Classes — Immutability and Copy Pattern

**Impact: HIGH**

Mutable data classes with `var` properties cause unpredictable state and
break the immutability contract that StateFlow/Compose depends on.

## Rule

### 1. All properties must be val — update via copy()

```kotlin
// ✅ Immutable data class — all val, default values for optional fields
data class QuestionUiState(
    val isLoading: Boolean = false,
    val questions: List<Question> = emptyList(),
    val selectedQuestion: Question? = null,
    val errorMessage: String? = null,
    val filter: QuestionFilter = QuestionFilter.ALL
)

// ✅ Update atomically via StateFlow.update + copy()
_uiState.update { current ->
    current.copy(
        isLoading = false,
        questions = newQuestions,
        errorMessage = null
    )
}
```

### 2. Domain models — separate from UI state and API models

```kotlin
// ✅ API/DB response model — matches JSON structure
@Serializable
data class QuestionDto(
    val id: String,
    @SerialName("question_text") val questionText: String,
    val subject: String,
    val difficulty: String,
    @SerialName("created_at") val createdAt: String
)

// ✅ Domain model — pure Kotlin, no framework deps
data class Question(
    val id: String,
    val text: String,
    val subject: Subject,
    val difficulty: Difficulty,
    val createdAt: LocalDateTime
)

// ✅ UI model — what the screen needs to display
data class QuestionDisplayItem(
    val id: String,
    val text: String,
    val subjectLabel: String,
    val difficultyColor: Color,
    val timeAgo: String
)

// ✅ Mapper in data layer
fun QuestionDto.toDomain() = Question(
    id = id,
    text = questionText,
    subject = Subject.fromString(subject),
    difficulty = Difficulty.fromString(difficulty),
    createdAt = LocalDateTime.parse(createdAt)
)
```

### 3. Equality — data classes compare by value

```kotlin
// ✅ Compose uses equals() to decide if recomposition is needed
// data classes provide structural equality automatically
data class UserProfile(val name: String, val avatarUrl: String)

val profile1 = UserProfile("Alice", "https://...")
val profile2 = UserProfile("Alice", "https://...")
profile1 == profile2   // true — same values → Compose skips recomposition

// ❌ Regular class — always unequal unless same reference
class UserProfile(val name: String)
val p1 = UserProfile("Alice")
val p2 = UserProfile("Alice")
p1 == p2   // false — different references → Compose recomposes needlessly
```

### 4. Nested immutable updates

```kotlin
// ✅ Deep copy for nested data classes
data class AppState(
    val user: UserState = UserState(),
    val scan: ScanState = ScanState()
)

data class ScanState(
    val isScanning: Boolean = false,
    val result: ScanResult? = null
)

// Update nested state — create new copy at every level
_appState.update { state ->
    state.copy(
        scan = state.scan.copy(
            isScanning = false,
            result = newResult
        )
    )
}
```

## Anti-Patterns

```kotlin
// ❌ var in data class — breaks StateFlow equality check, enables mutation
data class WrongState(
    var isLoading: Boolean = false,   // ❌ mutable
    var questions: MutableList<Question> = mutableListOf()  // ❌ mutable list
)

// ❌ Mutating state directly — StateFlow won't emit
_uiState.value.questions.add(newQuestion)   // ❌ StateFlow doesn't detect mutation

// ❌ Using data class for entities with identity — equals breaks
data class User(val id: String, var name: String)  // ❌ two Users with same id but different name are unequal

// ❌ Giant data class for everything — hard to maintain
data class MegaState(
    // 50+ fields  // ❌ split into smaller focused state classes
)
```
