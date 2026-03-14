# Hilt Component Hierarchy Reference

## Full Component Tree

```
SingletonComponent          (@Singleton)         App lifetime
    └── ActivityRetainedComponent (@ActivityRetainedScoped) Survives rotation
            └── ViewModelComponent    (@ViewModelScoped)    ViewModel lifetime
            └── ActivityComponent     (@ActivityScoped)     Activity lifetime
                    └── FragmentComponent (@FragmentScoped) Fragment lifetime
                    └── ViewComponent     (@ViewScoped)     View lifetime
                    └── ViewWithFragmentComponent           View in Fragment
    └── ServiceComponent      (@ServiceScoped)     Service lifetime
```

## Bindings Available by Component

Each component inherits all bindings from its parent components.

| Component | Unique bindings available |
|---|---|
| `SingletonComponent` | `Application`, `@ApplicationContext Context` |
| `ActivityRetainedComponent` | *(inherits from Singleton)* |
| `ViewModelComponent` | `SavedStateHandle` |
| `ActivityComponent` | `Activity`, `@ActivityContext Context` |
| `FragmentComponent` | `Fragment` |
| `ViewComponent` | `View` |
| `ServiceComponent` | `Service` |

## Scope Annotation → @InstallIn Mapping

| Scope annotation | Required @InstallIn |
|---|---|
| `@Singleton` | `SingletonComponent::class` |
| `@ActivityRetainedScoped` | `ActivityRetainedComponent::class` |
| `@ViewModelScoped` | `ViewModelComponent::class` |
| `@ActivityScoped` | `ActivityComponent::class` |
| `@FragmentScoped` | `FragmentComponent::class` |
| `@ViewScoped` | `ViewComponent::class` |
| `@ServiceScoped` | `ServiceComponent::class` |
| *(unscoped)* | Any component |

## Standard Module Organization

```
di/
├── AppModule.kt          — @InstallIn(SingletonComponent)   — app-level deps
├── NetworkModule.kt      — @InstallIn(SingletonComponent)   — HTTP clients
├── DatabaseModule.kt     — @InstallIn(SingletonComponent)   — Room database
├── RepositoryModule.kt   — @InstallIn(SingletonComponent)   — @Binds repos
├── DispatcherModule.kt   — @InstallIn(SingletonComponent)   — Coroutine dispatchers
└── UseCaseModule.kt      — @InstallIn(ViewModelComponent)   — @Binds use cases
```

## @Provides vs @Binds Decision

```
Third-party class (Retrofit, OkHttp, Room, Supabase)?
    → @Provides in object module

Your class with interface?
    → @Binds in abstract class module
    → implementation needs @Inject constructor

Need both in one module?
    → abstract class module
    → @Binds as abstract fun
    → @Provides in companion object
```
