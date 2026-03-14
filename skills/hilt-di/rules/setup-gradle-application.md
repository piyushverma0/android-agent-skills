# Hilt Setup — Gradle, KSP, and Application Class

**Impact: CRITICAL**

Missing the Hilt plugin, wrong KSP setup, or missing `@HiltAndroidApp`
causes the entire DI graph to fail at compile time or runtime.

## Rule

### 1. Project-level build.gradle.kts

```kotlin
// build.gradle.kts (project root)
plugins {
    id("com.google.devtools.ksp") version "1.9.22-1.0.17" apply false
    id("com.google.dagger.hilt.android") version "2.51.1" apply false
}
```

### 2. App-level build.gradle.kts

```kotlin
// build.gradle.kts (app module)
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")           // ← KSP replaces kapt — faster builds
    id("com.google.dagger.hilt.android")    // ← Hilt plugin
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.51.1")
    ksp("com.google.dagger:hilt-android-compiler:2.51.1")   // ← KSP, not kapt

    // Hilt + Jetpack integrations
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")  // hiltViewModel()
    implementation("androidx.hilt:hilt-work:1.2.0")                // HiltWorker
    ksp("androidx.hilt:hilt-compiler:1.2.0")                       // for hilt-work

    // Testing
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.51.1")
    kspAndroidTest("com.google.dagger:hilt-android-compiler:2.51.1")
    testImplementation("com.google.dagger:hilt-android-testing:2.51.1")
    kspTest("com.google.dagger:hilt-android-compiler:2.51.1")
}
```

### 3. Application class — mandatory

```kotlin
// MyApplication.kt
@HiltAndroidApp   // ← triggers Hilt's code generation — must be present
class MyApplication : Application()
```

```xml
<!-- AndroidManifest.xml -->
<application
    android:name=".MyApplication"   <!-- ← must point to your Application class -->
    ...>
```

### 4. Activity / Fragment — @AndroidEntryPoint

```kotlin
// Every Activity/Fragment that uses Hilt injection must be annotated
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    // Activities and Fragments can now receive @Inject fields
}

@AndroidEntryPoint
class HomeFragment : Fragment() {
    @Inject lateinit var analytics: AnalyticsTracker
}
```

## Anti-Patterns

```kotlin
// ❌ Using kapt instead of KSP — 2-3x slower builds
kapt("com.google.dagger:hilt-android-compiler:2.51.1")   // ❌ deprecated
ksp("com.google.dagger:hilt-android-compiler:2.51.1")    // ✅

// ❌ Missing @HiltAndroidApp — "HiltComponents.SingletonC is not found" error
class MyApplication : Application()   // ❌ missing annotation

// ❌ Missing @AndroidEntryPoint on Activity — injection silently skipped
class MainActivity : ComponentActivity() {
    @Inject lateinit var repo: ScanRepository   // ❌ will crash — lateinit not initialized
}

// ❌ Wrong Application class name in manifest
// android:name=".App"  ← but class is named MyApplication → app won't launch
```
