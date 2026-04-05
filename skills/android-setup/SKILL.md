---
name: android-setup
description: |
  Android project initialization and environment setup for AI agents. Use this skill whenever
  starting a new Android project, setting up build files, configuring version catalogs, choosing
  SDK versions, setting up Kotlin DSL, or when the agent needs to know the project's base
  configuration. Triggers on: new Android project, build.gradle.kts, settings.gradle.kts,
  libs.versions.toml, version catalog, minSdk, targetSdk, compileSdk, KSP setup, project
  structure, Gradle Kotlin DSL, AndroidManifest, app module setup, multi-module init.
  Always use this skill before writing any build files or starting a new Android project.
---

# Android Project Setup

Correct project initialization prevents 80% of downstream agent errors. Read this entire skill before writing any build files.

## Non-negotiables

- Kotlin DSL only (`build.gradle.kts`, `settings.gradle.kts`) — never Groovy `.gradle`
- Version Catalog only (`libs.versions.toml`) — never hardcode versions in build files
- KSP only — never `kapt`
- `minSdk = 24`, `targetSdk = 35`, `compileSdk = 35`
- Kotlin `2.0.0+`, AGP `8.5.0+`
- `namespace` declared in every module's `build.gradle.kts`

## Project Structure

```
my-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/company/app/
│   │   │   ├── MainActivity.kt
│   │   │   └── MyApplication.kt
│   │   ├── res/
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── core/
│   ├── data/
│   ├── domain/
│   └── ui/
├── feature/
│   └── <feature-name>/
├── gradle/
│   └── libs.versions.toml       ← ALL versions live here
├── build.gradle.kts              ← root, no dependencies
├── settings.gradle.kts
└── gradle.properties
```

## settings.gradle.kts

```kotlin
pluginManagement {
    repositories {
        google { content { includeGroupByRegex("com\\.android.*"); includeGroupByRegex("com\\.google.*"); includeGroupByRegex("androidx.*") } }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "MyApp"
include(":app")
// include(":core:data")  // add modules as needed
```

## Root build.gradle.kts

```kotlin
// Top-level build file. Do NOT add dependencies here.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}
```

## App build.gradle.kts

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "com.company.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.company.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    // Compose BOM — single version controls all Compose libs
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
```

## libs.versions.toml (Version Catalog)

```toml
[versions]
agp = "8.5.2"
kotlin = "2.0.21"
ksp = "2.0.21-1.0.25"
coreKtx = "1.13.1"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"
lifecycleRuntimeKtx = "2.8.6"
activityCompose = "1.9.2"
composeBom = "2024.10.00"
navigationCompose = "2.8.3"
hilt = "2.52"
hiltNavigationCompose = "1.2.0"
room = "2.6.1"
retrofit = "2.11.0"
coroutines = "1.9.0"
coil = "2.7.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }
androidx-hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hiltNavigationCompose" }
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
retrofit-core = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-kotlin-serialization = { group = "com.squareup.retrofit2", name = "converter-kotlinx-serialization", version.ref = "retrofit" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
coil-compose = { group = "io.coil-kt", name = "coil-compose", version.ref = "coil" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
```

## gradle.properties

```properties
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
org.gradle.configuration-cache=true
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

## MyApplication.kt

```kotlin
@HiltAndroidApp
class MyApplication : Application()
```

## AndroidManifest.xml (minimal)

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:name=".MyApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyApp">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## MainActivity.kt

```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyAppTheme {
                MyApp()
            }
        }
    }
}
```

## Common Mistakes

❌ Using Groovy `.gradle` files instead of Kotlin `.kts`
❌ Hardcoding versions in build files instead of version catalog
❌ Using `kapt` instead of `ksp`
❌ Missing `enableEdgeToEdge()` in MainActivity
❌ Setting `compileSdk` lower than `targetSdk`
❌ Forgetting `namespace` in module `build.gradle.kts`
❌ Using `implementation` for annotation processors instead of `ksp`

## Deep-dive references

- `references/multi-module.md` — when to add core/feature modules and how
- `references/build-variants.md` — flavor configuration for staging/prod environments
