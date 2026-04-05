---
name: gradle
description: |
  Gradle build system for Android AI agents. Use this skill whenever configuring Gradle,
  managing dependencies with Version Catalog, Gradle Kotlin DSL, Convention Plugins,
  composite builds, build variants, product flavors, build types, signing configs,
  Gradle properties, build optimization, configuration cache, parallel execution,
  dependency conflicts, version resolution, kapt vs KSP migration, buildSrc vs includeBuild,
  or any Gradle build issue. Triggers on: build.gradle.kts, libs.versions.toml, Gradle error,
  dependency, plugin, flavor, buildType, convention plugin, build speed.
---

# Gradle Build System

## Rule 1: Version Catalog is the only place for versions

```toml
# gradle/libs.versions.toml — single source of truth
[versions]
agp = "8.5.2"
kotlin = "2.0.21"
ksp = "2.0.21-1.0.25"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
```

```kotlin
// ✅ Use catalog aliases everywhere — never hardcode versions
implementation(libs.androidx.core.ktx)
plugins { alias(libs.plugins.android.application) }

// ❌ Hardcoded versions anywhere in build files
implementation("androidx.core:core-ktx:1.13.1")
```

## Rule 2: Convention Plugins for multi-module consistency

```kotlin
// buildSrc/src/main/kotlin/AndroidLibraryConventionPlugin.kt
class AndroidLibraryConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        pluginManager.apply("com.android.library")
        pluginManager.apply("org.jetbrains.kotlin.android")

        extensions.configure<LibraryExtension> {
            compileSdk = 35
            defaultConfig.minSdk = 24
            compileOptions {
                sourceCompatibility = JavaVersion.VERSION_17
                targetCompatibility = JavaVersion.VERSION_17
            }
        }
    }
}

// buildSrc/build.gradle.kts
plugins { `kotlin-dsl` }
dependencies {
    implementation(libs.android.gradlePlugin)
    implementation(libs.kotlin.gradlePlugin)
}

// Any feature module build.gradle.kts
plugins {
    id("convention.android.library")   // one line instead of 20
}
```

## Rule 3: Build variants for environments

```kotlin
// ✅ Product flavors for different environments
android {
    flavorDimensions += "environment"

    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "BASE_URL", "\"https://dev-api.myapp.com/\"")
        }
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("String", "BASE_URL", "\"https://staging-api.myapp.com/\"")
        }
        create("prod") {
            dimension = "environment"
            buildConfigField("String", "BASE_URL", "\"https://api.myapp.com/\"")
        }
    }
}
// Results in: devDebug, devRelease, stagingDebug, stagingRelease, prodDebug, prodRelease
```

## Rule 4: Signing config

```kotlin
// ✅ Read signing from environment — never commit keystore or passwords
android {
    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("KEYSTORE_PATH") ?: ""
            val keystorePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
            val keyAlias = System.getenv("KEY_ALIAS") ?: ""
            val keyPassword = System.getenv("KEY_PASSWORD") ?: ""

            if (keystorePath.isNotEmpty()) {
                storeFile = file(keystorePath)
                storePassword = keystorePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            }
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

## Rule 5: Build performance — always enabled

```properties
# gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:+UseParallelGC
org.gradle.configuration-cache=true
org.gradle.parallel=true
org.gradle.caching=true
android.nonTransitiveRClass=true
android.enableR8.fullMode=true
```

## Rule 6: KSP migration from kapt

```kotlin
// ❌ kapt — slow, requires Java stub generation
plugins { id("kotlin-kapt") }
kapt(libs.hilt.compiler)
kapt(libs.room.compiler)

// ✅ KSP — 2-3× faster, Kotlin-native
plugins { alias(libs.plugins.ksp) }
ksp(libs.hilt.compiler)
ksp(libs.room.compiler)
```

## Common Mistakes

❌ Version numbers in build files — always use `libs.*` catalog references
❌ kapt — migrate to ksp for all annotation processors
❌ Missing `org.gradle.configuration-cache=true` — 30-50% slower builds
❌ Root build.gradle.kts with dependencies — root is plugins only
❌ Hardcoded signing credentials — read from environment variables
❌ No product flavors — use dev/staging/prod for env-specific config
