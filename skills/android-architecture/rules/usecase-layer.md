# UseCase Layer — When to Add, When to Skip

**Impact: HIGH**

Adding UseCases everywhere is over-engineering. Skipping them when logic is
genuinely shared or complex causes bloated ViewModels. This rule defines
exactly when to add a UseCase.

## Rule

### Add a UseCase ONLY when one of these is true

```
1. Business logic is shared across 2+ ViewModels
2. Logic combines data from 2+ repositories
3. Logic is complex enough to need its own unit tests in isolation
4. The operation has a distinct business name (not just "get" or "save")
```

### Correct UseCase — shared, multi-repository, named operation

```kotlin
// ✅ UseCase: combines UserRepository + ScanRepository + has business logic
// Used by: ScanViewModel AND HomeViewModel → justifies extraction
class CheckAndConsumeScanQuotaUseCase @Inject constructor(
    private val userRepository: UserRepository,
    private val scanRepository: ScanRepository
) {
    suspend operator fun invoke(userId: String): Result<QuotaConsumeResult> {
        // Business rule: premium users have unlimited scans
        val isPremium = userRepository.isPremium(userId).getOrDefault(false)
        if (isPremium) return Result.success(QuotaConsumeResult.Unlimited)

        // Non-premium: check and consume quota
        return scanRepository.consumeQuota(userId)
    }
}

// ✅ UseCase: complex calculation with distinct business name
class CalculateExamReadinessUseCase @Inject constructor(
    private val questionRepository: QuestionRepository,
    private val progressRepository: ProgressRepository
) {
    suspend operator fun invoke(userId: String, subject: String): ReadinessScore {
        val attempted = progressRepository.getAttemptedCount(userId, subject)
        val correct   = progressRepository.getCorrectCount(userId, subject)
        val total     = questionRepository.getTotalCount(subject)
        return ReadinessScore.calculate(attempted, correct, total)
    }
}
```

### UseCases use operator fun invoke for clean call syntax

```kotlin
// ✅ operator fun invoke — called like a function
class GetSortedQuestionsUseCase @Inject constructor(
    private val repository: QuestionRepository
) {
    operator fun invoke(
        questions: List<Question>,
        sortBy: SortCriteria
    ): List<Question> = when (sortBy) {
        SortCriteria.DIFFICULTY -> questions.sortedBy { it.difficultyScore }
        SortCriteria.SUBJECT    -> questions.sortedBy { it.subject.name }
        SortCriteria.RECENT     -> questions.sortedByDescending { it.createdAt }
    }
}

// In ViewModel — reads like a function call
val sorted = getSortedQuestionsUseCase(questions, SortCriteria.DIFFICULTY)
```

### Skip UseCase — put logic directly in ViewModel

```kotlin
// ✅ Simple, single-ViewModel logic — NO UseCase needed
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val userRepository: UserRepository   // ← direct repository, no UseCase
) : ViewModel() {

    fun updateDisplayName(name: String) {
        if (name.isBlank()) {
            _events.emit(ProfileEvent.ShowError("Name cannot be empty"))
            return
        }
        viewModelScope.launch {
            userRepository.updateDisplayName(name.trim())
                .onSuccess { _events.emit(ProfileEvent.ShowSuccess("Name updated")) }
                .onFailure { _events.emit(ProfileEvent.ShowError(it.message ?: "Failed")) }
        }
    }
}
// A ProfileUseCase wrapping one repository call adds indirection with no value
```

### UseCase location

```
domain/
└── usecase/
    ├── CheckAndConsumeScanQuotaUseCase.kt   ← combines 2 repos
    ├── CalculateExamReadinessUseCase.kt     ← complex calculation
    └── GetSortedQuestionsUseCase.kt         ← shared across 3 screens
```

## Anti-Patterns

```kotlin
// ❌ UseCase wrapping a single repository call — pointless indirection
class GetQuestionsUseCase @Inject constructor(private val repo: QuestionRepository) {
    suspend operator fun invoke() = repo.getQuestions()  // ❌ just call repo directly
}

// ❌ UseCase for every ViewModel function — over-engineering
class UpdateNameUseCase(...)     // ❌ one ViewModel, one repo, no logic
class LoadProfileUseCase(...)    // ❌ same
class ClearCacheUseCase(...)     // ❌ same

// ❌ UseCase with Android dependencies — breaks domain layer isolation
class ScanUseCase @Inject constructor(
    private val context: Context   // ❌ Android dep in domain layer
)

// ❌ UseCase has its own StateFlow — UseCases are stateless functions
class WrongUseCase {
    val result = MutableStateFlow<Result?>(null)   // ❌ state belongs in ViewModel
}
```
