# Assisted Injection — Runtime Parameters in ViewModels

**Impact: HIGH**

When a ViewModel needs both injected dependencies AND runtime arguments
(like an ID from navigation), assisted injection provides the correct solution.

## Rule

### 1. @HiltViewModel with assistedFactory (Hilt 2.49+)

```kotlin
// ✅ Modern approach — @HiltViewModel(assistedFactory = ...)
@HiltViewModel(assistedFactory = ProductDetailViewModel.Factory::class)
class ProductDetailViewModel @AssistedInject constructor(
    @Assisted val productId: String,           // ← runtime parameter
    private val repository: ProductRepository, // ← injected by Hilt
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    val product = repository.getProduct(productId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    @AssistedFactory
    interface Factory {
        fun create(productId: String): ProductDetailViewModel
    }
}

// ✅ In Composable — pass factory via creationCallback
@Composable
fun ProductDetailScreen(
    productId: String,
    viewModel: ProductDetailViewModel = hiltViewModel<ProductDetailViewModel,
        ProductDetailViewModel.Factory> { factory ->
        factory.create(productId)
    }
) {
    val product by viewModel.product.collectAsStateWithLifecycle()
    // ...
}
```

### 2. Multiple @Assisted parameters

```kotlin
// ✅ Multiple runtime parameters — each needs @Assisted
@HiltViewModel(assistedFactory = OrderViewModel.Factory::class)
class OrderViewModel @AssistedInject constructor(
    @Assisted("orderId") val orderId: String,      // ← use named qualifier when same type
    @Assisted("userId") val userId: String,
    private val repository: OrderRepository
) : ViewModel() {

    @AssistedFactory
    interface Factory {
        fun create(
            @Assisted("orderId") orderId: String,
            @Assisted("userId") userId: String
        ): OrderViewModel
    }
}

// ✅ Composable usage
val viewModel = hiltViewModel<OrderViewModel, OrderViewModel.Factory> { factory ->
    factory.create(orderId = orderId, userId = userId)
}
```

### 3. When to use assisted injection vs SavedStateHandle

```
Use @Assisted when:
- Parameter is a primitive or simple value type (String, Int, Boolean)
- Parameter is only needed at creation time
- You want compile-time safety

Use SavedStateHandle when:
- Parameter comes from navigation arguments (it's already there)
- You need the value to survive process death
- It's a String/Int/Parcelable nav arg
```

```kotlin
// ✅ Prefer SavedStateHandle for nav args — simpler, survives process death
@HiltViewModel
class DetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: Repository
) : ViewModel() {
    private val itemId: String = checkNotNull(savedStateHandle["itemId"])
}
```

## Anti-Patterns

```kotlin
// ❌ Passing dependencies as @Assisted — Hilt injects those, not you
@AssistedInject constructor(
    @Assisted val repository: ScanRepository,  // ❌ repository is injected, not runtime
    @Assisted val productId: String            // ✅ productId is runtime
)

// ❌ Using @Inject with @Assisted constructor — wrong annotation
class WrongViewModel @Inject constructor(     // ❌ must be @AssistedInject
    @Assisted val productId: String,
    private val repo: Repository
)
// ✅ @AssistedInject constructor

// ❌ Multiple @Assisted of same type without named qualifier — ambiguous
@AssistedInject constructor(
    @Assisted val id1: String,   // ❌ Hilt can't distinguish id1 from id2
    @Assisted val id2: String
)
// ✅ Use @Assisted("name") qualifier for same-type parameters
```
