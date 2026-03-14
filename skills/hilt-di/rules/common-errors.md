# Hilt Common Errors — Causes and Fixes

**Impact: CRITICAL**

Hilt compile errors are cryptic. This rule maps every common error message
to its exact cause and fix so agents don't waste time guessing.

## Error Reference

### 1. "[Dagger/MissingBinding] cannot be provided without an @Inject constructor or @Provides"

```
Error: [Dagger/MissingBinding] ScanRepository cannot be provided without an
@Inject constructor or an @Provides-annotated method.
```

**Cause:** Hilt doesn't know how to create `ScanRepository`.

**Fix:**
```kotlin
// Option A — Add @Inject to constructor (for concrete classes)
class ScanRepositoryImpl @Inject constructor(...) : ScanRepository

// Option B — Add @Binds or @Provides in a module (for interfaces)
@Module @InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton
    abstract fun bindScanRepository(impl: ScanRepositoryImpl): ScanRepository
}
```

---

### 2. "@Binds methods must be abstract"

```
Error: @Binds methods must be abstract
```

**Cause:** `@Binds` is in a `object` (concrete) module instead of `abstract class`.

**Fix:**
```kotlin
// ❌
@Module @InstallIn(SingletonComponent::class)
object WrongModule {
    @Binds abstract fun bind(impl: Impl): Interface   // ❌ object can't have abstract
}

// ✅
@Module @InstallIn(SingletonComponent::class)
abstract class CorrectModule {
    @Binds abstract fun bind(impl: Impl): Interface   // ✅
}
```

---

### 3. "UninitializedPropertyAccessException: lateinit property X has not been initialized"

**Cause:** `hiltRule.inject()` not called before using `@Inject` fields in tests,
OR `@AndroidEntryPoint` missing from Activity/Fragment.

**Fix:**
```kotlin
// In tests
@Before fun setUp() {
    hiltRule.inject()   // ← must be called before @Inject fields are accessed
}

// In Activity/Fragment
@AndroidEntryPoint   // ← must be present
class MainActivity : ComponentActivity() {
    @Inject lateinit var repo: ScanRepository
}
```

---

### 4. "HiltComponents.SingletonC is not found"

**Cause:** `@HiltAndroidApp` missing from Application class.

**Fix:**
```kotlin
@HiltAndroidApp   // ← missing
class MyApplication : Application()
```

---

### 5. "@ActivityScoped/@FragmentScoped bound in wrong component"

```
Error: @ActivityScoped may only be used in bindings under @ActivityComponent
```

**Cause:** Scope annotation doesn't match `@InstallIn` component.

**Fix:**
```kotlin
// ❌ Scope mismatch
@Module @InstallIn(SingletonComponent::class)
abstract class WrongModule {
    @Binds @ActivityScoped   // ❌ ActivityScoped can't be in SingletonComponent
    abstract fun bind(impl: Impl): Interface
}

// ✅ Scope must match component
@Module @InstallIn(ActivityComponent::class)
abstract class CorrectModule {
    @Binds @ActivityScoped
    abstract fun bind(impl: Impl): Interface
}
```

---

### 6. "Duplicate bindings"

```
Error: [Dagger/DuplicateBindings] ScanRepository is bound multiple times
```

**Cause:** Two modules both provide/bind the same type without a qualifier.

**Fix:**
```kotlin
// ❌ Two @Provides for the same type
@Provides fun provideRepo1(): ScanRepository = ...
@Provides fun provideRepo2(): ScanRepository = ...

// ✅ Add qualifier to distinguish them
@Provides @Qualifier1 fun provideRepo1(): ScanRepository = ...
@Provides @Qualifier2 fun provideRepo2(): ScanRepository = ...
```

---

### 7. "Cannot inject into a non-@AndroidEntryPoint / @HiltAndroidApp class"

**Cause:** Activity/Fragment missing `@AndroidEntryPoint`.

**Fix:**
```kotlin
@AndroidEntryPoint   // ← add this
class HomeFragment : Fragment() {
    @Inject lateinit var viewModel: HomeViewModel
}
```

---

## Error Quick Reference

| Error message | Cause | Fix |
|---|---|---|
| `cannot be provided without @Inject or @Provides` | Missing binding | Add `@Inject` constructor or `@Provides` module |
| `@Binds methods must be abstract` | `@Binds` in `object` module | Use `abstract class` module |
| `lateinit not initialized` | Missing `hiltRule.inject()` or `@AndroidEntryPoint` | Call inject() in @Before or add annotation |
| `HiltComponents not found` | Missing `@HiltAndroidApp` | Add to Application class |
| `may only be used in bindings under @XComponent` | Scope/component mismatch | Match scope annotation to @InstallIn component |
| `bound multiple times` | Duplicate bindings | Add qualifier annotations |
