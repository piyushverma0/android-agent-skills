# Navigation Architecture — Type-Safe Routes and NavGraph Organization

**Impact: HIGH**

Inline navigation strings cause typos, hard-to-find bugs, and no IDE support.
NavGraph spread across screens makes navigation flow impossible to understand.

## Rule

### 1. Sealed class for all routes — single source of truth

```kotlin
// ui/navigation/Screen.kt
sealed class Screen(val route: String) {

    // ── Top-level screens ──────────────────────────────────────────────
    object Splash  : Screen("splash")
    object Login   : Screen("login")
    object Home    : Screen("home")

    // ── Scan feature ───────────────────────────────────────────────────
    object Scan : Screen("scan")

    object ScanResult : Screen("scan_result/{questionId}") {
        const val ARG_QUESTION_ID = "questionId"
        fun createRoute(questionId: String) = "scan_result/$questionId"
    }

    // ── Profile feature ────────────────────────────────────────────────
    object Profile : Screen("profile")

    object EditProfile : Screen("edit_profile/{userId}") {
        const val ARG_USER_ID = "userId"
        fun createRoute(userId: String) = "edit_profile/$userId"
    }

    // ── Dialogs / Bottom sheets as destinations ────────────────────────
    object UpgradeSheet : Screen("upgrade_sheet")

    companion object {
        // ✅ All route strings in one place — easy to audit
        val startDestination = Splash.route
        val authGraph        = Login.route
        val mainGraph        = Home.route
    }
}
```

### 2. NavGraph in one place — not scattered in screens

```kotlin
// ui/navigation/AppNavGraph.kt
@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.startDestination
) {
    NavHost(
        navController  = navController,
        startDestination = startDestination
    ) {
        // ── Auth flow ────────────────────────────────────────────────
        composable(Screen.Splash.route) {
            SplashScreen(
                onAuthenticatedUser    = { navController.navigate(Screen.Home.route) {
                    popUpTo(Screen.Splash.route) { inclusive = true }
                }},
                onUnauthenticatedUser = { navController.navigate(Screen.Login.route) {
                    popUpTo(Screen.Splash.route) { inclusive = true }
                }}
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = { navController.navigate(Screen.Home.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }}
            )
        }

        // ── Main flow ────────────────────────────────────────────────
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToScan = { navController.navigate(Screen.Scan.route) }
            )
        }

        composable(Screen.Scan.route) {
            ScanScreen(
                onNavigateToResult = { questionId ->
                    navController.navigate(Screen.ScanResult.createRoute(questionId))
                }
            )
        }

        composable(
            route = Screen.ScanResult.route,
            arguments = listOf(
                navArgument(Screen.ScanResult.ARG_QUESTION_ID) {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val questionId = backStackEntry.arguments
                ?.getString(Screen.ScanResult.ARG_QUESTION_ID)
                ?: return@composable
            ScanResultScreen(
                questionId = questionId,
                onBack     = { navController.popBackStack() }
            )
        }

        // ── Upgrade sheet ────────────────────────────────────────────
        bottomSheet(Screen.UpgradeSheet.route) {
            UpgradeSheet(
                onDismiss = { navController.popBackStack() }
            )
        }
    }
}
```

### 3. Screens receive callbacks — never navController directly

```kotlin
// ✅ Screen receives lambdas — not navController
@Composable
fun ScanScreen(
    onNavigateToResult: (questionId: String) -> Unit,   // ← lambda
    onGetMore: () -> Unit,
    viewModel: ScanViewModel = hiltViewModel()
) {
    // ...
    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is ScanEvent.ScanComplete -> onNavigateToResult(event.questionId)
                ScanEvent.QuotaExhausted  -> onGetMore()
                else -> {}
            }
        }
    }
}

// ❌ Screen directly navigates — couples screen to nav structure
@Composable
fun WrongScreen(navController: NavController) {
    Button(onClick = { navController.navigate("scan_result/abc") }) { }  // ❌ inline string
}
```

### 4. Deep links

```kotlin
// ✅ Deep link declaration in NavHost
composable(
    route = Screen.ScanResult.route,
    arguments = listOf(navArgument(Screen.ScanResult.ARG_QUESTION_ID) { type = NavType.StringType }),
    deepLinks = listOf(navDeepLink {
        uriPattern = "https://yourapp.com/scan/{questionId}"
    })
) { ... }

// AndroidManifest.xml
// <intent-filter android:autoVerify="true">
//     <data android:scheme="https" android:host="yourapp.com" />
// </intent-filter>
```

## Anti-Patterns

```kotlin
// ❌ Inline navigation strings — typos crash at runtime
navController.navigate("scan_reslt/$questionId")   // ❌ typo: "reslt"
// ✅
navController.navigate(Screen.ScanResult.createRoute(questionId))

// ❌ NavController passed to ViewModel — wrong layer
@HiltViewModel
class WrongViewModel @Inject constructor(
    private val navController: NavController   // ❌ Android dep in ViewModel
) : ViewModel()
// ✅ ViewModel emits NavigateEvent, Composable handles navigation

// ❌ NavGraph split across feature files — impossible to understand flow
// scan/ScanScreen.kt: navController.navigate("profile")
// profile/ProfileScreen.kt: navController.navigate("home")
// ✅ ALL navigation in AppNavGraph.kt
```
