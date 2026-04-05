---
name: android-architecture
description: |
  MVVM + Clean Architecture + Unidirectional Data Flow patterns for Android AI agents.
  Use this skill whenever designing app structure, creating ViewModels, Repositories, UseCases,
  data classes, domain models, UiState, UiEvent, package structure, separation of concerns,
  data layer, domain layer, presentation layer, dependency inversion, multi-module architecture,
  or any discussion of how to organize Android code. Always apply before writing any ViewModel,
  Repository, or UseCase. Triggers on: ViewModel, Repository, UseCase, UiState, architecture,
  data layer, domain layer, Clean Architecture, MVVM, MVI, package structure, module structure.
---

# Android Architecture

MVVM + Clean Architecture with Unidirectional Data Flow. These patterns prevent the most common
structural mistakes AI agents make when building Android apps.

## The three layers — strict separation

```
Presentation (UI)          →  only depends on Domain
    ViewModel              →  calls UseCases, exposes UiState + Events
    Composables            →  observes ViewModel, sends user actions

Domain (Business Logic)    →  pure Kotlin, zero Android dependencies
    UseCases               →  orchestrate one business operation
    Repository interfaces  →  contracts, implemented in Data layer
    Domain models          →  pure data classes

Data                       →  implements Domain interfaces
    Repository impls       →  coordinate local + remote sources
    Remote DataSource      →  Retrofit API calls
    Local DataSource       →  Room DAO calls
    DTOs / Mappers         →  never expose DTOs to Domain
```

**Rule:** Domain layer must never import `android.*`. If it does, the architecture is broken.

## Package structure

```
com.company.app/
├── di/                        ← Hilt modules only
│   ├── AppModule.kt
│   └── NetworkModule.kt
├── ui/
│   ├── theme/
│   ├── navigation/
│   │   └── AppNavGraph.kt
│   └── feature/
│       └── home/
│           ├── HomeScreen.kt      ← Composable
│           ├── HomeViewModel.kt
│           └── HomeUiState.kt
├── domain/
│   ├── model/
│   │   └── Item.kt               ← pure data class
│   ├── repository/
│   │   └── ItemRepository.kt     ← interface
│   └── usecase/
│       └── GetItemsUseCase.kt
└── data/
    ├── repository/
    │   └── ItemRepositoryImpl.kt
    ├── remote/
    │   ├── ItemApiService.kt
    │   └── dto/
    │       └── ItemDto.kt
    └── local/
        ├── ItemDao.kt
        └── entity/
            └── ItemEntity.kt
```

## ViewModel — complete pattern

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getItems: GetItemsUseCase,
    private val toggleFavorite: ToggleFavoriteUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<HomeEvent>()
    val events: SharedFlow<HomeEvent> = _events.asSharedFlow()

    init {
        loadItems()
    }

    fun loadItems() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            getItems()
                .onSuccess { items ->
                    _uiState.value = if (items.isEmpty()) HomeUiState.Empty
                    else HomeUiState.Success(items)
                }
                .onFailure { error ->
                    _uiState.value = HomeUiState.Error(error.message ?: "Unknown error")
                }
        }
    }

    fun onItemClick(itemId: String) {
        viewModelScope.launch {
            _events.emit(HomeEvent.NavigateToDetail(itemId))
        }
    }

    fun onFavoriteClick(itemId: String) {
        viewModelScope.launch {
            toggleFavorite(itemId)
                .onFailure { _events.emit(HomeEvent.ShowError("Failed to update favorite")) }
        }
    }
}
```

## UiState + UiEvent — define them together

```kotlin
sealed interface HomeUiState {
    data object Loading : HomeUiState
    data object Empty : HomeUiState
    data class Success(val items: List<Item>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

sealed interface HomeEvent {
    data class NavigateToDetail(val itemId: String) : HomeEvent
    data class ShowError(val message: String) : HomeEvent
    data object NavigateToCreate : HomeEvent
}
```

## UseCase — single responsibility

```kotlin
// ✅ One UseCase = one business operation
class GetItemsUseCase @Inject constructor(
    private val repository: ItemRepository
) {
    suspend operator fun invoke(): Result<List<Item>> =
        repository.getItems()
}

// ✅ UseCases return Result<T> — never throw exceptions to ViewModel
class ToggleFavoriteUseCase @Inject constructor(
    private val repository: ItemRepository
) {
    suspend operator fun invoke(itemId: String): Result<Unit> =
        repository.toggleFavorite(itemId)
}

// ❌ UseCase doing too much — split into separate UseCases
class ItemUseCase @Inject constructor(val repo: ItemRepository) {
    suspend fun getItems() = repo.getItems()
    suspend fun createItem(item: Item) = repo.create(item)
    suspend fun deleteItem(id: String) = repo.delete(id)
    // This is a service, not a use case
}
```

## Repository — interface in Domain, implementation in Data

```kotlin
// domain/repository/ItemRepository.kt
interface ItemRepository {
    suspend fun getItems(): Result<List<Item>>
    suspend fun getItem(id: String): Result<Item>
    suspend fun toggleFavorite(id: String): Result<Unit>
    fun getItemsStream(): Flow<List<Item>>  // for real-time updates
}

// data/repository/ItemRepositoryImpl.kt
class ItemRepositoryImpl @Inject constructor(
    private val remoteSource: ItemRemoteDataSource,
    private val localSource: ItemLocalDataSource,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : ItemRepository {

    override suspend fun getItems(): Result<List<Item>> = withContext(dispatcher) {
        runCatching {
            val remote = remoteSource.getItems()
            localSource.saveItems(remote.map { it.toEntity() })
            remote.map { it.toDomain() }
        }.recoverCatching {
            localSource.getItems().map { it.toDomain() }  // fallback to cache
        }
    }

    override fun getItemsStream(): Flow<List<Item>> =
        localSource.getItemsFlow().map { entities -> entities.map { it.toDomain() } }
}
```

## Mappers — DTOs never cross the data layer boundary

```kotlin
// ✅ Map at the data layer boundary
fun ItemDto.toDomain() = Item(
    id = id,
    title = title,
    description = description,
    isFavorite = isFavorite
)

fun ItemEntity.toDomain() = Item(
    id = id,
    title = title,
    description = description,
    isFavorite = isFavorite
)

fun Item.toEntity() = ItemEntity(
    id = id,
    title = title,
    description = description,
    isFavorite = isFavorite
)

// ❌ Never expose DTOs or Entities to ViewModel or Composable
class HomeViewModel(val repo: ItemRepositoryImpl) {
    val items: StateFlow<List<ItemDto>> = ...  // DTO leaking into ViewModel!
}
```

## Screen — ViewModel wiring

```kotlin
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    navController: NavController
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is HomeEvent.NavigateToDetail -> navController.navigate(DetailRoute(event.itemId))
                is HomeEvent.ShowError -> { /* show snackbar */ }
                is HomeEvent.NavigateToCreate -> navController.navigate(CreateRoute)
            }
        }
    }

    HomeContent(
        uiState = uiState,
        onItemClick = viewModel::onItemClick,
        onFavoriteClick = viewModel::onFavoriteClick,
        onRetry = viewModel::loadItems
    )
}

// ✅ Separate content composable — testable without ViewModel
@Composable
private fun HomeContent(
    uiState: HomeUiState,
    onItemClick: (String) -> Unit,
    onFavoriteClick: (String) -> Unit,
    onRetry: () -> Unit
) {
    when (uiState) {
        is HomeUiState.Loading -> LoadingScreen()
        is HomeUiState.Empty -> EmptyScreen()
        is HomeUiState.Success -> ItemList(uiState.items, onItemClick, onFavoriteClick)
        is HomeUiState.Error -> ErrorScreen(uiState.message, onRetry)
    }
}
```

## Common Mistakes

❌ ViewModel calling Room DAO directly — always go through Repository
❌ Repository in Domain layer — interface in Domain, implementation in Data
❌ Domain model with `@Entity` or `@SerialName` annotations — pure Kotlin only
❌ ViewModel holding Context — use Application context via Hilt if needed
❌ StateFlow for navigation events — use SharedFlow
❌ Try/catch in ViewModel — handle in Repository, return Result<T>
❌ Multiple ViewModels per screen — one ViewModel per screen
❌ Business logic in Composable — always in ViewModel or UseCase

## Deep-dive references

- `references/multi-module-arch.md` — structuring feature and core modules
- `references/flow-patterns.md` — stateIn, flatMapLatest, combine patterns
