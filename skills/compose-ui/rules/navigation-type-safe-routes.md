# Use Type-Safe Routes — Never Inline Strings

**Impact: HIGH**

Inline route strings (`navController.navigate("scan_result/123")`) are typo-prone,
not refactor-safe, and impossible to validate at compile time.

## Rule

Define all routes in a sealed class. Pass only primitive IDs through nav args.
Fetch full objects in the destination ViewModel.

```kotlin
// ✅ Sealed class routes — single source of truth
sealed class Screen(val route: String) {
    object Home         : Screen("home")
    object ScanQuestion : Screen("scan_question")

    // Routes with arguments — define arg name and create route helper
    object ScanResult : Screen("scan_result/{questionId}") {
        const val ARG_QUESTION_ID = "questionId"
        fun createRoute(questionId: String) = "scan_result/$questionId"
    }

    object ExamDetail : Screen("exam/{examId}/{subjectId}") {
        const val ARG_EXAM_ID    = "examId"
        const val ARG_SUBJECT_ID = "subjectId"
        fun createRoute(examId: String, subjectId: String) = "exam/$examId/$subjectId"
    }
}

// ✅ NavHost — declare argument types explicitly
@Composable
fun AppNavHost(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = Screen.Home.route) {

        composable(Screen.Home.route) {
            HomeScreen(onNavigateToScan = { navController.navigate(Screen.ScanQuestion.route) })
        }

        composable(
            route = Screen.ScanResult.route,
            arguments = listOf(
                navArgument(Screen.ScanResult.ARG_QUESTION_ID) { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val questionId = backStackEntry.arguments
                ?.getString(Screen.ScanResult.ARG_QUESTION_ID)
                ?: return@composable
            ScanResultScreen(
                questionId = questionId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}

// ✅ Navigate — use the route helper, never inline string
navController.navigate(Screen.ScanResult.createRoute(questionId = "abc123"))

// ✅ In destination ViewModel — fetch the full object from ID
@HiltViewModel
class ScanResultViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: ScanRepository,
) : ViewModel() {
    private val questionId: String = savedStateHandle[Screen.ScanResult.ARG_QUESTION_ID]!!
    val question = repository.getQuestionById(questionId).stateIn(...)
}
```

## Anti-Patterns

```kotlin
// ❌ Inline route strings — typo-prone, breaks on rename
navController.navigate("scan_result/${question.id}")  // typo danger

// ❌ Passing full objects as nav args — not safe, causes issues with process death
navController.navigate("detail/${Json.encodeToString(question)}")  // ❌

// ❌ Fetching full objects in composable instead of ViewModel
composable("scan_result/{id}") { backStackEntry ->
    val id = backStackEntry.arguments?.getString("id")
    val question = repository.getQuestion(id)  // ❌ side effect in composition
    ScanResultScreen(question = question)
}
```

## Shared ViewModel Across Screens

```kotlin
// ✅ Scope ViewModel to a navigation graph — shared state across a flow
@Composable
fun CheckoutScreenA(navController: NavController) {
    val parentEntry = remember(navController) {
        navController.getBackStackEntry("checkout_graph")
    }
    val sharedViewModel: CheckoutViewModel = hiltViewModel(parentEntry)
}
```
