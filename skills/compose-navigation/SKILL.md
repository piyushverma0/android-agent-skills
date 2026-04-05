---
name: compose-navigation
description: |
  Jetpack Compose Navigation for Android AI agents. Use this skill whenever implementing
  navigation, NavHost, NavController, back stack, deep links, navigation arguments, routes,
  type-safe navigation, @Serializable routes, navController.navigate, popBackStack,
  navigateUp, bottom navigation, tab navigation, nested navigation graphs, shared ViewModels
  across destinations, navigation with Hilt, passing arguments between screens, transition
  animations between screens, or any navigation pattern. Always apply before writing any
  NavHost or navigation logic. Triggers on: navigate, NavController, NavHost, route, backstack,
  deep link, navigation argument, destination, composable(), navigation graph.
---

# Compose Navigation

Type-safe navigation prevents the most common navigation bugs in AI-built apps.
These rules cover the complete navigation pattern from setup to deep links.

## Setup

```toml
# libs.versions.toml
navigationCompose = "2.8.3"
[libraries]
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }
```

## Rule 1: Type-safe routes with @Serializable

```kotlin
// ✅ Define all routes as @Serializable objects/data classes
// navigation/Routes.kt

@Serializable
object HomeRoute

@Serializable
object SearchRoute

@Serializable
data class ItemDetailRoute(val itemId: String)

@Serializable
data class EditItemRoute(val itemId: String, val isNew: Boolean = false)

@Serializable
object SettingsRoute

// ❌ String routes — typos compile, arguments are untyped
navController.navigate("detail/$itemId")          // typo-prone
composable("detail/{itemId}") { backStackEntry ->
    val id = backStackEntry.arguments?.getString("itemId")  // nullable, untyped
}
```

## Rule 2: NavHost setup

```kotlin
// ✅ Complete NavHost with type-safe destinations
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    startDestination: Any = HomeRoute
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable<HomeRoute> {
            HomeScreen(
                onItemClick = { itemId ->
                    navController.navigate(ItemDetailRoute(itemId))
                },
                onSearchClick = { navController.navigate(SearchRoute) }
            )
        }

        composable<SearchRoute> {
            SearchScreen(
                onItemClick = { itemId ->
                    navController.navigate(ItemDetailRoute(itemId))
                },
                onBackClick = { navController.navigateUp() }
            )
        }

        composable<ItemDetailRoute> { backStackEntry ->
            val route: ItemDetailRoute = backStackEntry.toRoute()
            ItemDetailScreen(
                itemId = route.itemId,
                onEditClick = { navController.navigate(EditItemRoute(route.itemId)) },
                onBackClick = { navController.navigateUp() }
            )
        }

        composable<EditItemRoute> { backStackEntry ->
            val route: EditItemRoute = backStackEntry.toRoute()
            EditItemScreen(
                itemId = route.itemId,
                isNew = route.isNew,
                onSaved = { navController.navigateUp() },
                onCancel = { navController.navigateUp() }
            )
        }

        composable<SettingsRoute> {
            SettingsScreen(onBackClick = { navController.navigateUp() })
        }
    }
}
```

## Rule 3: Navigate with launchSingleTop for tabs

```kotlin
// ✅ Tab navigation — prevent duplicate destinations on backstack
fun NavController.navigateToTopLevel(route: Any) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }
}

// Usage in NavigationSuiteScaffold
item(
    selected = currentDestination?.hasRoute<HomeRoute>() == true,
    onClick = { navController.navigateToTopLevel(HomeRoute) }
)
```

## Rule 4: Nested navigation graphs for feature isolation

```kotlin
// ✅ Nested graph for auth flow
@Serializable
object AuthGraph

@Serializable
object LoginRoute

@Serializable
object RegisterRoute

@Serializable
object ForgotPasswordRoute

// In NavHost
navigation<AuthGraph>(startDestination = LoginRoute) {
    composable<LoginRoute> {
        LoginScreen(
            onLoginSuccess = {
                navController.navigate(HomeRoute) {
                    popUpTo(AuthGraph) { inclusive = true }  // clear auth stack
                }
            },
            onRegisterClick = { navController.navigate(RegisterRoute) },
            onForgotPasswordClick = { navController.navigate(ForgotPasswordRoute) }
        )
    }
    composable<RegisterRoute> { ... }
    composable<ForgotPasswordRoute> { ... }
}

// Main app entry point decides which graph to show
NavHost(startDestination = if (isLoggedIn) HomeRoute else AuthGraph) { ... }
```

## Rule 5: Shared ViewModel scoped to NavGraph

```kotlin
// ✅ Share ViewModel across multiple destinations in a nested graph
@Serializable
object CheckoutGraph

@Serializable
object CartRoute

@Serializable
object ShippingRoute

@Serializable
object PaymentRoute

@Serializable
object OrderConfirmationRoute

// NavHost
navigation<CheckoutGraph>(startDestination = CartRoute) {
    composable<CartRoute> { entry ->
        val parentEntry = remember(entry) {
            navController.getBackStackEntry(CheckoutGraph)
        }
        val viewModel: CheckoutViewModel = hiltViewModel(parentEntry)
        CartScreen(viewModel = viewModel)
    }
    composable<ShippingRoute> { entry ->
        val parentEntry = remember(entry) {
            navController.getBackStackEntry(CheckoutGraph)
        }
        val viewModel: CheckoutViewModel = hiltViewModel(parentEntry)
        ShippingScreen(viewModel = viewModel)
    }
    // Same pattern for PaymentRoute, OrderConfirmationRoute
}
```

## Rule 6: Deep links

```kotlin
// ✅ Deep link with type-safe route
composable<ItemDetailRoute>(
    deepLinks = listOf(
        navDeepLink<ItemDetailRoute>(
            basePath = "https://myapp.com/items"
        )
    )
) { backStackEntry ->
    val route: ItemDetailRoute = backStackEntry.toRoute()
    ItemDetailScreen(itemId = route.itemId)
}

// AndroidManifest.xml — declare the intent filter
<activity android:name=".MainActivity">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="myapp.com" />
    </intent-filter>
</activity>
```

## Rule 7: Result passing between screens

```kotlin
// ✅ Use SavedStateHandle to pass results back
// In the screen that receives the result
@HiltViewModel
class HomeViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    val newItemId = savedStateHandle.getStateFlow<String?>("new_item_id", null)
}

// In the screen that sends the result
@Composable
fun CreateItemScreen(
    navController: NavController,
    viewModel: CreateItemViewModel = hiltViewModel()
) {
    val onSave = {
        navController.previousBackStackEntry
            ?.savedStateHandle
            ?.set("new_item_id", viewModel.savedItemId)
        navController.navigateUp()
    }
}
```

## Rule 8: Navigation transitions

```kotlin
// ✅ Custom enter/exit transitions per destination
composable<ItemDetailRoute>(
    enterTransition = {
        slideInHorizontally(initialOffsetX = { it }) + fadeIn(tween(300))
    },
    exitTransition = {
        slideOutHorizontally(targetOffsetX = { -it / 3 }) + fadeOut(tween(200))
    },
    popEnterTransition = {
        slideInHorizontally(initialOffsetX = { -it / 3 }) + fadeIn(tween(200))
    },
    popExitTransition = {
        slideOutHorizontally(targetOffsetX = { it }) + fadeOut(tween(300))
    }
) { ... }
```

## Common Mistakes

❌ String routes — use `@Serializable` data classes
❌ `navController.navigate(route)` for tabs — always use `launchSingleTop = true`
❌ Arguments as nullable strings from `arguments?.getString()` — use `backStackEntry.toRoute()`
❌ ViewModel per Composable — scope to NavGraph when sharing state across screens
❌ Missing `popUpTo` when navigating from auth to main flow — user can press back to login
❌ Passing complex objects as navigation args — pass only IDs, load in destination ViewModel
❌ `LocalContext.current` to get NavController — pass NavController or actions as lambdas
