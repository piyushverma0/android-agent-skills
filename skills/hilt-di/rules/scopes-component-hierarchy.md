# Hilt Scopes — Choose the Correct Lifetime

**Impact: CRITICAL**

Using `@Singleton` for everything wastes memory and prevents testing.
Using too-narrow scopes causes dependencies to be recreated unnecessarily.

## Rule

### Scope reference table

| Annotation | Component | Lifetime | Use for |
|---|---|---|---|
| `@Singleton` | `SingletonComponent` | App lifetime | Repositories, network clients, database |
| `@ActivityRetainedScoped` | `ActivityRetainedComponent` | Survives rotation | Shared data between Activity and its ViewModels |
| `@ViewModelScoped` | `ViewModelComponent` | ViewModel lifetime | Use cases, mappers scoped to one ViewModel |
| `@ActivityScoped` | `ActivityComponent` | Activity lifetime | Analytics trackers, navigation managers |
| `@FragmentScoped` | `FragmentComponent` | Fragment lifetime | Fragment-specific presenters |
| `@ServiceScoped` | `ServiceComponent` | Service lifetime | Service-specific dependencies |
| (none) | N/A | New instance per injection | Stateless utilities, factories |

### Decision guide

```kotlin
// ✅ @Singleton — shared state, expensive to create, safe to share across app
@Module @InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "app.db").build()

    @Provides @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(...)
}

// ✅ @ViewModelScoped — scoped to a single ViewModel, holds ViewModel-scoped state
@Module @InstallIn(ViewModelComponent::class)
abstract class UseCaseModule {
    @Binds @ViewModelScoped
    abstract fun bindSolveQuestionUseCase(impl: SolveQuestionUseCaseImpl): SolveQuestionUseCase
}

// ✅ No scope = unscoped — new instance per injection
// Use for: stateless mappers, formatters, pure utility classes
class QuestionMapper @Inject constructor() {
    fun toDisplayItem(question: Question): QuestionDisplayItem { ... }
}

// ✅ @ActivityRetainedScoped — survives rotation, shared between Activity + ViewModels
@ActivityRetainedScoped
class NavigationCoordinator @Inject constructor() { ... }
```

### Component hierarchy — child components can access parent bindings

```
SingletonComponent
    └── ActivityRetainedComponent
            └── ViewModelComponent
            └── ActivityComponent
                    └── FragmentComponent
                    └── ViewComponent
```

A `@FragmentScoped` dependency can access `@Singleton` bindings.
A `@Singleton` binding cannot access `@FragmentScoped` bindings.

## Anti-Patterns

```kotlin
// ❌ @Singleton for everything — prevents proper scoping and test isolation
@Singleton class QuestionMapper @Inject constructor()   // ❌ doesn't need singleton lifetime

// ❌ Unscoped Repository — new instance on every injection, loses cached state
class ScanRepositoryImpl @Inject constructor(...)   // ❌ missing @Singleton
// ✅
@Singleton class ScanRepositoryImpl @Inject constructor(...)

// ❌ @ViewModelScoped in SingletonComponent — compile error
@Module @InstallIn(SingletonComponent::class)
abstract class WrongModule {
    @Binds @ViewModelScoped   // ❌ ViewModelScoped can't be in SingletonComponent
    abstract fun bind(impl: Impl): Interface
}
// ✅ Match scope annotation to component: @ViewModelScoped → ViewModelComponent
```
