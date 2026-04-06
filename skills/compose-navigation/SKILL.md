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
These rules cover the complete navigation pattern from setup to ---
name: compose-navigation
description: |
  Jetpack Compose Navigation for Android AI agents — complete patterns. Use this skill for
  any navigation: NavHost, NavController, type-safe @Serializable routes, back stack,
  deep links, navigation arguments, composable(), nested graphs, shared ViewModels,
  navigateUp, navigateTopLevel, launchSingleTop, popUpTo, shared element transitions,
  predictive back gesture, transition animations between screens, bottom navigation,
  navigation with Hilt, passing arguments, result passing via SavedStateHandle,
  or any navigation pattern in Compose. Always apply before writing any NavHost or route.
---

# Compose Navigation — Complete Guide

Type-safe navigation with shared element transitions and predictive back.
These rules cover every pattern from simple routes to complex multi-graph apps.

## Setup

```toml
[versions]
navigationCompose = "2.8.5"
[libraries]
navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }
```

## Rule 1: All routes are @Serializable — zero string routes

```kotlin
// navigation/Routes.kt — ALL routes defined here, nowhere else

@Serializable object HomeRoute
@Serializable object SearchRoute
@Serializable object InboxRoute
@Serializable object ProfileRoute
@Serializable object SettingsRoute

// Routes with required arguments
@Serializable data class ItemDetailRoute(val itemId: String)
@Serializable data class EditItemRoute(val itemId: String, val isNew: Boolean = false)
@Serializable data class UserProfileRoute(val userId: String, val fromNotification: Boolean = false)

// Graph containers
@Serializable object AuthGraph
@Serializable object LoginRoute
@Serializable object SignUpRoute
@Serializable object ForgotPasswordRoute

@Serializable object OnboardingGraph
@Serializable object OnboardingStep1Route
@Serializable object OnboardingStep2Route
@Serializable object OnboardingStep3Route

// ❌ NEVER use string routes
navController.navigate("detail/$itemId")           // typo-prone, no type safety
composable("detail/{itemId}") { backStackEntry ->
    backStackEntry.arguments?.getString("itemId")  // nullable, untyped
}
```

## Rule 2: Complete NavHost — every destination registered

```kotlin
// navigation/AppNavHost.kt
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    startDestination: Any = if (isLoggedIn) HomeRoute else AuthGraph
) {
    NavHost(
        navController    = navController,
        startDestination = startDestination,
        // M3 Expressive enter/exit transitions (applied to ALL screens by default)
        enterTransition  = { slideInHorizontally(
            initialOffsetX = { it },
            animationSpec  = tween(Duration.medium4, easing = AppEasing.EmphasizedDecel)
        ) + fadeIn(tween(Duration.medium4)) },
        exitTransition   = { slideOutHorizontally(
            targetOffsetX = { -it / 4 },
            animationSpec = tween(Duration.short4, easing = AppEasing.EmphasizedAccel)
        ) + fadeOut(tween(Duration.short4)) },
        popEnterTransition = { slideInHorizontally(
            initialOffsetX = { -it / 4 },
            animationSpec  = tween(Duration.medium4, easing = AppEasing.EmphasizedDecel)
        ) + fadeIn(tween(Duration.medium4)) },
        popExitTransition  = { slideOutHorizontally(
            targetOffsetX = { it },
            animationSpec = tween(Duration.short4, easing = AppEasing.EmphasizedAccel)
        ) + fadeOut(tween(Duration.short4)) }
    ) {
        // Top-level destinations
        composable<HomeRoute>   { HomeScreen(navController = navController) }
        composable<SearchRoute> { SearchScreen(navController = navController) }
        composable<InboxRoute>  { InboxScreen(navController = navController) }
        composable<ProfileRoute>{ ProfileScreen(navController = navController) }
        composable<SettingsRoute>{ SettingsScreen(onBack = { navController.navigateUp() }) }

        // Detail screens
        composable<ItemDetailRoute> { entry ->
            val route: ItemDetailRoute = entry.toRoute()
            ItemDetailScreen(
                itemId  = route.itemId,
                onEdit  = { navController.navigate(EditItemRoute(route.itemId)) },
                onBack  = { navController.navigateUp() }
            )
        }
        composable<EditItemRoute> { entry ->
            val route: EditItemRoute = entry.toRoute()
            EditItemScreen(
                itemId = route.itemId,
                isNew  = route.isNew,
                onDone = { navController.navigateUp() }
            )
        }

        // Auth flow — nested graph
        navigation<AuthGraph>(startDestination = LoginRoute) {
            composable<LoginRoute> {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(HomeRoute) {
                            popUpTo(AuthGraph) { inclusive = true }  // clear auth stack entirely
                        }
                    },
                    onSignUp       = { navController.navigate(SignUpRoute) },
                    onForgotPass   = { navController.navigate(ForgotPasswordRoute) }
                )
            }
            composable<SignUpRoute> {
                SignUpScreen(
                    onSuccess = { navController.navigate(HomeRoute) { popUpTo(AuthGraph) { inclusive = true } } },
                    onBack    = { navController.navigateUp() }
                )
            }
            composable<ForgotPasswordRoute> {
                ForgotPasswordScreen(onBack = { navController.navigateUp() })
            }
        }
    }
}
```

## Rule 3: Top-level navigation — launchSingleTop prevents duplicate entries

```kotlin
// ✅ Navigation helper for tab/nav items — prevents backstack pollution
fun NavController.navigateTopLevel(route: Any) {
    navigate(route) {
        // Pop to start destination, saving state for restoration
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true  // don't create duplicate on re-tap
        restoreState = true     // restore state when re-navigating to tab
    }
}

// Usage in NavigationSuiteScaffold
item(
    selected = currentDestination?.hasRoute<HomeRoute>() == true,
    onClick  = { navController.navigateTopLevel(HomeRoute) }
)
```

## Rule 4: Shared Element Transitions — M3 Expressive

```kotlin
// ✅ Shared element transition between list item and detail screen
// Navigation 2.8+ with material3 1.4+ supports SharedTransitionLayout

@Composable
fun HomeScreen(navController: NavController) {
    SharedTransitionLayout {
        AnimatedContent(targetState = selectedItem, label = "shared-transition") { item ->
            if (item == null) {
                LazyColumn {
                    items(items, key = { it.id }) { item ->
                        ItemCard(
                            item = item,
                            animatedVisibilityScope = this@AnimatedContent,
                            sharedTransitionScope = this@SharedTransitionLayout,
                            onClick = { selectedItem = item }
                        )
                    }
                }
            } else {
                ItemDetailScreen(
                    item = item,
                    animatedVisibilityScope = this@AnimatedContent,
                    sharedTransitionScope = this@SharedTransitionLayout,
                    onBack = { selectedItem = null }
                )
            }
        }
    }
}

// ✅ In list item — mark shared elements
@Composable
fun ItemCard(
    item: Item,
    sharedTransitionScope: SharedTransitionScope,
    animatedVisibilityScope: AnimatedVisibilityScope,
    onClick: () -> Unit,
) {
    with(sharedTransitionScope) {
        Card(onClick = onClick) {
            AsyncImage(
                model = item.imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .sharedElement(
                        state = rememberSharedContentState("image-${item.id}"),
                        animatedVisibilityScope = animatedVisibilityScope
                    )
                    .fillMaxWidth().aspectRatio(16f / 9f)
            )
            Text(
                item.title,
                modifier = Modifier.sharedElement(
                    state = rememberSharedContentState("title-${item.id}"),
                    animatedVisibilityScope = animatedVisibilityScope
                )
            )
        }
    }
}

// ✅ In detail screen — same shared element keys
@Composable
fun ItemDetailScreen(
    item: Item,
    sharedTransitionScope: SharedTransitionScope,
    animatedVisibilityScope: AnimatedVisibilityScope,
    onBack: () -> Unit
) {
    with(sharedTransitionScope) {
        Column {
            AsyncImage(
                model = item.imageUrl,
                contentDescription = item.title,
                modifier = Modifier
                    .sharedElement(
                        state = rememberSharedContentState("image-${item.id}"),
                        animatedVisibilityScope = animatedVisibilityScope
                    )
                    .fillMaxWidth().aspectRatio(16f / 9f)
            )
            Text(
                item.title,
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.sharedElement(
                    state = rememberSharedContentState("title-${item.id}"),
                    animatedVisibilityScope = animatedVisibilityScope
                ).padding(Spacing.md)
            )
        }
    }
}
```

## Rule 5: Deep links with type-safe routes

```kotlin
// ✅ Deep link registered on destination
composable<ItemDetailRoute>(
    deepLinks = listOf(
        navDeepLink<ItemDetailRoute>(basePath = "https://myapp.com/items")
        // matches: https://myapp.com/items/{itemId}
    )
) { entry ->
    val route: ItemDetailRoute = entry.toRoute()
    ItemDetailScreen(itemId = route.itemId)
}

// AndroidManifest.xml — intent filter
// <activity android:name=".MainActivity">
//     <intent-filter android:autoVerify="true">
//         <action android:name="android.intent.action.VIEW"/>
//         <category android:name="android.intent.category.DEFAULT"/>
//         <category android:name="android.intent.category.BROWSABLE"/>
//         <data android:scheme="https" android:host="myapp.com"/>
//     </intent-filter>
// </activity>
```

## Rule 6: Shared ViewModel scoped to NavGraph

```kotlin
// ✅ Share state across multiple screens in a graph
navigation<CheckoutGraph>(startDestination = CartRoute) {
    composable<CartRoute> { entry ->
        val parentEntry = remember(entry) { navController.getBackStackEntry(CheckoutGraph) }
        val viewModel: CheckoutViewModel = hiltViewModel(parentEntry)
        CartScreen(viewModel)
    }
    composable<ShippingRoute> { entry ->
        val parentEntry = remember(entry) { navController.getBackStackEntry(CheckoutGraph) }
        val viewModel: CheckoutViewModel = hiltViewModel(parentEntry)
        ShippingScreen(viewModel)
    }
    composable<PaymentRoute> { entry ->
        val parentEntry = remember(entry) { navController.getBackStackEntry(CheckoutGraph) }
        val viewModel: CheckoutViewModel = hiltViewModel(parentEntry)
        PaymentScreen(viewModel)
    }
}
```

## Rule 7: Result passing via SavedStateHandle

```kotlin
// ✅ Pass result back to previous destination
// In destination that produces result:
@Composable
fun CreateItemScreen(navController: NavController) {
    val onSaved = { newItemId: String ->
        navController.previousBackStackEntry
            ?.savedStateHandle
            ?.set("new_item_id", newItemId)
        navController.navigateUp()
    }
}

// In destination that receives result:
@HiltViewModel
class HomeViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    val newItemId = savedStateHandle.getStateFlow<String?>("new_item_id", null)
}
```

## Rule 8: Predictive back — enable in manifest

```xml
<!-- AndroidManifest.xml — required for predictive back gesture (Android 14+) -->
<application android:enableOnBackInvokedCallback="true">
```

```kotlin
// ✅ NavHost 2.8+ handles predictive back automatically for type-safe routes
// ✅ Custom back handler with animation for non-NavHost back
BackHandler {
    coroutineScope.launch {
        // Animate out before popping
        isVisible = false
        delay(Duration.short4.toLong())
        navController.navigateUp()
    }
}
```

## Common Mistakes

❌ String routes anywhere — use `@Serializable` object/data class
❌ `navController.navigate(route)` for tabs — use `navigateTopLevel()`
❌ `navController.navigate(SomeRoute) { popUpTo(0) }` — pops past graph root; use `graph.findStartDestination().id`
❌ `hiltViewModel()` in every screen that shares state — scope to NavGraph entry
❌ Missing `popUpTo(AuthGraph) { inclusive = true }` after login — user can press Back to login
❌ Passing complex objects as route args — pass only IDs, fetch in ViewModel
❌ SharedElement keys not matching between list and detail — transition won't animate
❌ No screen-level transitions in NavHost — add enter/exit/pop specs at NavHost leveldeep links.

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
