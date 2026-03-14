# Multi-Module — When to Split and How

**Impact: MEDIUM**

Premature modularization adds build complexity with no benefit.
Staying in a single module too long creates circular dependency nightmares.
This rule defines the exact trigger points for modularization.

## Rule

### When to stay single-module

```
Single module is correct when:
✅ Team size: 1-3 developers
✅ App size: < 50 screens
✅ Build time: < 2 minutes on incremental builds
✅ No reuse of features across multiple apps
✅ No strict ownership boundaries between teams
```

### When to modularize

```
Modularize when:
✅ Full build time > 3 minutes (incremental builds slow down development)
✅ Multiple apps share the same feature (e.g., user/auth module across apps)
✅ Team grows beyond 5 developers with clear ownership boundaries
✅ You need to ship a dynamic feature module (Play Feature Delivery)
```

### Standard module graph when you do split

```
:app                    ← thin wiring layer, no business logic
├── :feature:scan       ← self-contained feature
├── :feature:auth       ← self-contained feature
├── :feature:home       ← self-contained feature
└── :core:ui            ← shared Compose components, theme
    :core:data          ← shared data layer utilities
    :core:domain        ← shared domain models and interfaces
    :core:network       ← HTTP client setup
    :core:database      ← Room database
    :core:testing       ← shared test utilities, fakes
```

### Module dependencies — strictly one direction

```
:feature:* → :core:domain → (nothing)
:feature:* → :core:ui
:core:data → :core:domain
:app        → :feature:* + :core:*

❌ :feature:scan → :feature:auth   — feature-to-feature dependency
❌ :core:domain → :core:data       — domain depends on data (inverted!)
❌ :feature:home → :feature:scan   — features must be independent
```

### Feature module structure

```kotlin
// Each feature module mirrors the single-module layer structure
:feature:scan/
├── src/main/kotlin/com/company/app/feature/scan/
│   ├── data/
│   │   ├── model/ScanSolveResponseDto.kt
│   │   ├── repository/ScanRepositoryImpl.kt
│   │   └── mapper/ScanMapper.kt
│   ├── domain/
│   │   ├── model/ScanSolveResponse.kt
│   │   ├── repository/ScanRepository.kt
│   │   └── usecase/CheckScanQuotaUseCase.kt
│   ├── ui/
│   │   ├── ScanScreen.kt
│   │   ├── ScanViewModel.kt
│   │   └── components/
│   └── di/
│       └── ScanModule.kt
```

### build.gradle.kts for a feature module

```kotlin
// :feature:scan/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.company.app.feature.scan"
    compileSdk = 35
}

dependencies {
    implementation(project(":core:domain"))    // ← domain interfaces and models
    implementation(project(":core:ui"))        // ← shared composables
    implementation(project(":core:network"))   // ← HTTP client

    implementation("com.google.dagger:hilt-android:2.51.1")
    ksp("com.google.dagger:hilt-android-compiler:2.51.1")
}
```

## Anti-Patterns

```kotlin
// ❌ Modularizing on day 1 — massive overhead, premature optimization
// Start single-module and extract only when pain is felt

// ❌ Feature depending on another feature
// :feature:scan depending on :feature:payment → circular coupling
// ✅ Extract shared logic to :core:domain or :core:data

// ❌ Circular module dependencies
// :core:data → :core:network → :core:data   ← circular
// ✅ :core:network has no dependencies
//    :core:data depends on :core:network

// ❌ Too many modules — maintenance nightmare
// 47 modules for a 3-person team — rebuild overhead > build speed benefit
```
