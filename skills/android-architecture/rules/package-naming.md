# Package Naming and Project Organization

**Impact: MEDIUM**

Inconsistent package naming makes navigation painful. Wrong organization
causes cross-layer dependencies and circular imports.

## Rule

### Feature-based package structure (recommended for large apps)

```
com.company.appname
├── core/                               ← shared across all features
│   ├── di/                             ← Hilt modules (AppModule, DispatcherModule)
│   ├── network/                        ← HTTP client setup
│   ├── database/                       ← Room database, migrations
│   ├── navigation/                     ← Screen sealed class, NavGraph
│   └── ui/
│       ├── components/                 ← shared composables (Button, Card, Badge)
│       └── theme/                      ← MaterialTheme, Color, Typography
│
├── feature/
│   ├── scan/                           ← self-contained feature module
│   │   ├── data/
│   │   │   ├── model/                  ← ScanSolveResponseDto
│   │   │   ├── repository/             ← ScanRepositoryImpl
│   │   │   └── mapper/                 ← ScanMapper
│   │   ├── domain/
│   │   │   ├── model/                  ← ScanSolveResponse (domain)
│   │   │   ├── repository/             ← ScanRepository (interface)
│   │   │   └── usecase/                ← CheckScanQuotaUseCase
│   │   └── ui/
│   │       ├── ScanScreen.kt
│   │       ├── ScanViewModel.kt
│   │       ├── ScanUiState.kt
│   │       └── components/             ← ScanModeChip, SolvingIndicator
│   │
│   ├── auth/
│   │   ├── data/ → domain/ → ui/
│   │   └── ui/
│   │       ├── LoginScreen.kt
│   │       └── LoginViewModel.kt
│   │
│   └── home/
│       └── ui/
│           ├── HomeScreen.kt
│           └── HomeViewModel.kt
│
└── app/                                ← app-level wiring
    ├── MainActivity.kt
    ├── MyApplication.kt
    └── di/                             ← cross-feature DI modules
```

### Layer-based package structure (simpler apps)

```
com.company.appname
├── data/
│   ├── model/                          ← all DTOs
│   ├── remote/                         ← all remote data sources
│   ├── local/                          ← Room, DataStore
│   ├── repository/                     ← all implementations
│   └── mapper/                         ← all mappers
├── domain/
│   ├── model/                          ← all domain models
│   ├── repository/                     ← all interfaces
│   └── usecase/                        ← all use cases
├── ui/
│   ├── screens/
│   │   ├── scan/                       ← ScanScreen + ScanViewModel
│   │   ├── home/                       ← HomeScreen + HomeViewModel
│   │   └── auth/                       ← LoginScreen + LoginViewModel
│   ├── components/                     ← shared composables
│   ├── navigation/                     ← NavGraph, Screen
│   └── theme/                          ← MaterialTheme
└── di/                                 ← all Hilt modules
```

### File naming conventions

```kotlin
// ✅ Screens — PascalCase + Screen suffix
ScanQuestionScreen.kt
ScanResultScreen.kt
HomeScreen.kt
LoginScreen.kt

// ✅ ViewModels — PascalCase + ViewModel suffix (same name as screen)
ScanQuestionViewModel.kt
ScanResultViewModel.kt
HomeViewModel.kt

// ✅ UiState and Events — in same file as ViewModel or separate if large
// ScanUiState.kt, ScanEvent.kt (separate when file gets large)

// ✅ Repositories
ScanRepository.kt          ← interface (domain)
ScanRepositoryImpl.kt      ← implementation (data)

// ✅ Modules
AppModule.kt               ← app-level bindings
NetworkModule.kt           ← HTTP/network clients
DatabaseModule.kt          ← Room
RepositoryModule.kt        ← @Binds for all repos
DispatcherModule.kt        ← Coroutine dispatchers

// ✅ DTOs — Dto suffix distinguishes from domain models
QuestionDto.kt
ScanSolveResponseDto.kt

// ✅ Mappers — Mapper suffix or extension functions in mapper file
QuestionMapper.kt          ← contains QuestionDto.toDomain()
```

## Anti-Patterns

```kotlin
// ❌ Putting everything in one package
com.company.app
├── ScanScreen.kt
├── ScanViewModel.kt
├── ScanRepository.kt        ← interface and impl in same package
├── ScanRepositoryImpl.kt
├── Question.kt              ← domain model and DTO same package
├── QuestionDto.kt

// ❌ Using "util" as a dumping ground
com.company.app.util
├── ApiHelper.kt             ← what kind of helper?
├── DataUtils.kt             ← ambiguous
├── Misc.kt                  ← never acceptable

// ❌ ViewModels in a single flat directory
ui/viewmodel/
├── HomeViewModel.kt
├── ScanViewModel.kt
├── ProfileViewModel.kt      ← should be in their feature folders
// ✅ co-locate with their screen
ui/screens/home/HomeViewModel.kt
ui/screens/scan/ScanViewModel.kt
```
