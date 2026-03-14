---
name: android-architecture
description: |
  Android MVVM architecture with Unidirectional Data Flow (UDF). Use this skill
  when structuring Android projects, designing layers (data/domain/ui), creating
  ViewModels, designing Repository interfaces, deciding on UseCase layers, organizing
  packages, handling UiState/UiEvent patterns, navigation with sealed class routes,
  data model mapping (DTO/domain/UI model), multi-module decisions, or any discussion
  of separation of concerns, Clean Architecture, or Android app structure.
---

# Android Architecture

Production-complete MVVM + UDF architecture patterns. 13 rules across 7 categories.

## Layer Overview

```
ui/          ← HOW to show data  (Compose, ViewModel, StateFlow, navigation)
domain/      ← WHAT the app does  (pure Kotlin, interfaces, UseCases, no Android)
data/        ← HOW to get data   (Repositories, DTOs, Room, network, mappers)

Dependencies: ui → domain ← data    (domain depends on NOTHING)
```

---

## CRITICAL — Layers

### Rule 1: Three Layers, One Direction

```
app/
├── data/
│   ├── model/       ← @Serializable DTOs (match API/DB schema exactly)
│   ├── remote/      ← Supabase, Retrofit data sources
│   ├── local/       ← Room DAOs
│   ├── repository/  ← implementations of domain interfaces
│   └── mapper/      ← QuestionDto.toDomain() extension functions
├── domain/
│   ├── model/       ← pure Kotlin data classes, typed enums, no Android
│   ├── repository/  ← interfaces only (no imports from data layer)
│   └── usecase/     ← only when shared 2+ ViewModels OR complex logic
└── ui/
    ├── screens/     ← one folder per screen (Screen.kt + ViewModel.kt)
    ├── components/  ← shared composables
    ├── navigation/  ← AppNavGraph, Screen sealed class
    └── theme/       ← MaterialTheme
```

```kotlin
// ✅ domain model — no framework imports
data class Question(val id: String, val subject: Subject, val createdAt: LocalDateTime)

// ✅ data DTO — matches DB schema
@Serializable data class QuestionDto(
    val id: String,
    @SerialName("question_text") val questionText: String,
    @SerialName("created_at")    val createdAt: String
)

// ✅ mapper in data layer
fun QuestionDto.toDomain() = Question(id, subject = Subject.fromString(subject), ...)

// ❌ Android import in domain model — can't unit test
data class Question(val bitmap: Bitmap)   // ❌
// ❌ Network call in ViewModel — wrong layer
viewModelScope.launch { supabase.from("questions").select()... }   // ❌
```

---

## CRITICAL — UiState

### Rule 2: Single Data Class, Single StateFlow

```kotlin
// ✅ One immutable data class per screen — all val, all defaults
data class ScanUiState(
    val isLoading: Boolean = false,
    val isSolving: Boolean = false,
    val result: ScanSolveResponse? = null,
    val questions: List<Question> = emptyList(),
    val errorMessage: String? = null,
    val remainingScans: Int = 5,
    val selectedMode: ScanMode = ScanMode.GENERAL
)

// ✅ One MutableStateFlow — atomic updates via update{}
private val _uiState = MutableStateFlow(ScanUiState())
val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()
_uiState.update { it.copy(isSolving = true, errorMessage = null) }

// ✅ Collect with lifecycle awareness
val uiState by viewModel.uiState.collectAsStateWithLifecycle()

// ❌ Multiple StateFlows — race conditions, inconsistent state
val isLoading = MutableStateFlow(false)   // ❌
val result    = MutableStateFlow<Result?>(null)   // ❌
// ❌ var in data class — StateFlow won't detect mutation
```

---

## CRITICAL — UiEvents

### Rule 3: SharedFlow for One-Shot Events

```kotlin
// ✅ Sealed interface — navigation, toasts, snackbars
sealed interface ScanEvent {
    data class ShowError(val message: String)         : ScanEvent
    data class Navigate(val route: String)            : ScanEvent
    data class QuotaExhausted(val remaining: Int)     : ScanEvent
    object SessionExpired                             : ScanEvent
}

// ✅ MutableSharedFlow — replay = 0, never re-fires on rotation
private val _events = MutableSharedFlow<ScanEvent>()
val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

// ✅ Collect — LaunchedEffect(Unit) correct for hot SharedFlow
LaunchedEffect(Unit) {
    viewModel.events.collect { event ->
        when (event) {
            is ScanEvent.Navigate      -> navController.navigate(event.route)
            is ScanEvent.ShowError     -> snackbarHost.showSnackbar(event.message)
            is ScanEvent.QuotaExhausted -> navController.navigate(Screen.Upgrade.route)
            ScanEvent.SessionExpired   -> navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }
}

// ❌ Navigation in UiState — re-fires on rotation
data class WrongState(val navigationDestination: String? = null)   // ❌
```

---

## CRITICAL — Repository

### Rule 4: Interface in Domain, Implementation in Data, Result Wrapping

```kotlin
// ✅ domain interface — zero SDK imports
interface ScanRepository {
    suspend fun scanSolveQuestion(...): Result<ScanSolveResponse>   // ← Result, not raw type
    fun observeScanHistory(userId: String): Flow<List<ScanHistory>>
}

// ✅ data implementation — SDK exceptions converted to domain exceptions
class ScanRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) : ScanRepository {
    override suspend fun scanSolveQuestion(...): Result<ScanSolveResponse> =
        withContext(ioDispatcher) {
            runCatching {
                supabase.functions.invoke("scan-solve-question", body = buildJsonObject { ... })
                    .body<ScanSolveResponse>()
            }.mapCatching { it }
             .recoverCatching { throw mapTodomainException(it) }
        }
}

// ❌ No interface — untestable
class ScanViewModel @Inject constructor(val repo: ScanRepositoryImpl)   // ❌
// ❌ No Result wrapping — ViewModel must import SDK exceptions
// ❌ Missing withContext(IO) — network on wrong thread
```

---

## CRITICAL — ViewModel

### Rule 5: ViewModel Responsibilities

```kotlin
// ✅ Complete ViewModel structure
@HiltViewModel
class ScanViewModel @Inject constructor(
    private val scanRepository: ScanRepository,   // ← interface only
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()
    private val _events = MutableSharedFlow<ScanEvent>()
    val events: SharedFlow<ScanEvent> = _events.asSharedFlow()

    fun solve(imageBase64: String, mimeType: String) {
        if (_uiState.value.isSolving) return   // ← guard double-tap
        viewModelScope.launch {
            _uiState.update { it.copy(isSolving = true) }
            scanRepository.scanSolveQuestion(...)
                .onSuccess { _uiState.update { s -> s.copy(isSolving = false, result = it) } }
                .onFailure { error ->
                    _uiState.update { s -> s.copy(isSolving = false) }
                    when (error) {
                        is QuotaExhaustedException -> _events.emit(ScanEvent.QuotaExhausted(0))
                        is AuthException           -> _events.emit(ScanEvent.SessionExpired)
                        else -> _events.emit(ScanEvent.ShowError(error.message ?: "Failed"))
                    }
                }
        }
    }
    fun clearError()  { _uiState.update { it.copy(errorMessage = null) } }
    fun clearResult() { _uiState.update { it.copy(result = null) } }
}

// ❌ Context in ViewModel — memory leak
// ❌ Exposing MutableStateFlow publicly — UI can mutate state
// ❌ NavController in ViewModel — Android dep, wrong layer
```

---

## HIGH — Data Models

### Rule 6: DTO → Domain → UI Model Pipeline

```kotlin
// Three model types — one per layer
@Serializable data class QuestionDto(   // ← data: matches DB schema
    @SerialName("question_text") val questionText: String,
    val difficulty: String
)
data class Question(                     // ← domain: pure Kotlin, typed
    val text: String,
    val difficulty: Difficulty           // ← enum, not String
)
data class QuestionDisplayItem(          // ← ui: formatted for display
    val text: String,
    val difficultyLabel: String,         // ← "Medium"
    val difficultyColor: Color           // ← Color(0xFFE65100)
)

// Enums carry their mapping logic
enum class Difficulty(val apiValue: String, val label: String, val color: Color) {
    EASY("easy", "Easy", Color(0xFF2E7D32)),
    MEDIUM("medium", "Medium", Color(0xFFE65100)),
    HARD("hard", "Hard", Color(0xFFC62828));
    companion object { fun fromString(v: String) = entries.find { it.apiValue == v } ?: MEDIUM }
}

// ❌ Single model for all layers — API changes break UI, UI concerns in domain
// ❌ Raw String for typed values — "math" vs "Math" vs "MATH" inconsistent
```

---

## HIGH — UseCase Layer

### Rule 7: Add UseCase Only When Justified

```kotlin
// ✅ Add UseCase when: logic shared 2+ ViewModels OR combines 2+ repos
class CheckAndConsumeScanQuotaUseCase @Inject constructor(
    private val userRepository: UserRepository,
    private val scanRepository: ScanRepository
) {
    suspend operator fun invoke(userId: String): Result<QuotaConsumeResult> {
        val isPremium = userRepository.isPremium(userId).getOrDefault(false)
        return if (isPremium) Result.success(QuotaConsumeResult.Unlimited)
        else scanRepository.consumeQuota(userId)
    }
}

// ❌ UseCase wrapping single repository call — pointless indirection
class GetQuestionsUseCase(private val repo: QuestionRepository) {
    suspend operator fun invoke() = repo.getQuestions()   // ❌ just call repo directly
}
// ❌ UseCase with Android deps — breaks domain isolation
// ❌ UseCase with its own StateFlow — state belongs in ViewModel
```

---

## HIGH — Navigation

### Rule 8: Sealed Class Routes, NavGraph in One Place

```kotlin
// ✅ All routes defined once — no inline strings
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object ScanResult : Screen("scan_result/{questionId}") {
        const val ARG = "questionId"
        fun createRoute(id: String) = "scan_result/$id"
    }
    object Upgrade : Screen("upgrade")
}

// ✅ ALL navigation declared in one AppNavGraph.kt
NavHost(navController, startDestination = Screen.Home.route) {
    composable(Screen.Home.route) {
        HomeScreen(onNavigateToScan = { navController.navigate(Screen.Scan.route) })
    }
    composable(Screen.ScanResult.route,
        arguments = listOf(navArgument(Screen.ScanResult.ARG) { type = NavType.StringType })
    ) { backStackEntry ->
        val id = backStackEntry.arguments?.getString(Screen.ScanResult.ARG) ?: return@composable
        ScanResultScreen(questionId = id, onBack = { navController.popBackStack() })
    }
}

// ✅ Screens receive lambdas, not NavController
@Composable fun ScanScreen(onNavigateToResult: (String) -> Unit, ...)

// ❌ Inline navigation strings — typos crash at runtime
// ❌ NavController in ViewModel — wrong layer
// ❌ Navigation split across screen files — can't understand flow
```

---

## MEDIUM — Testing

### Rule 9: Unit Tests for ViewModel and UseCase, No Android Needed

```kotlin
// ✅ Fast JVM unit test — no Hilt, no instrumentation
class ScanViewModelTest {
    @get:Rule val mainDispatcherRule = MainDispatcherRule()
    private val fakeRepo = FakeScanRepository()
    private val viewModel = ScanViewModel(scanRepository = fakeRepo)

    @Test fun `shows result on success`() = runTest {
        viewModel.solveCapturedImage("base64", "image/jpeg", "math", false)
        advanceUntilIdle()
        assertThat(viewModel.uiState.value.result).isNotNull()
    }
}

// ✅ Fake over Mock — controllable, no framework needed
class FakeScanRepository : ScanRepository {
    var error: Exception? = null
    var result = defaultScanResult
    override suspend fun scanSolveQuestion(...) =
        error?.let { Result.failure(it) } ?: Result.success(result)
}

// ❌ Mocking data classes — use constructors
// ❌ Instrumented test for ViewModel — too slow
// ❌ Testing ViewModel with real network — flaky
```

---

## References

- `references/architecture-decisions.md` — Quick decision tables: UseCase vs ViewModel, DTO vs Domain vs UI model, UiState vs Event, single-module vs multi-module, test type per component. Read when making architecture decisions.
- `rules/` — 13 individual rule files with complete examples, anti-patterns, and decision guides for each rule above.
