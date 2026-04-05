---
name: play-store-release
description: |
  Play Store release process for Android AI agents. Use this skill whenever preparing
  an Android app for Play Store submission, creating a release AAB, app signing, Play App
  Signing, version code management, release tracks (internal/alpha/beta/production),
  store listing requirements, content ratings, data safety form, target API level requirements,
  Play Store policies, APK vs AAB, deobfuscation files, ProGuard mappings, release notes,
  screenshots requirements, feature graphic, app icon requirements, or any Play Store
  publishing step. Always apply before any release build.
---

# Play Store Release

## Release checklist — complete before every submission

### 1. Version management

```kotlin
// build.gradle.kts — increment both on every release
android {
    defaultConfig {
        versionCode = 12           // integer, must increment every upload
        versionName = "2.4.0"     // human-readable, semantic versioning
    }
}

// ✅ Automate versionCode in CI using build number
val versionCode = System.getenv("BUILD_NUMBER")?.toIntOrNull() ?: 1
```

### 2. Release build — required configuration

```kotlin
buildTypes {
    release {
        isMinifyEnabled = true           // required — reduces APK size
        isShrinkResources = true         // required — removes unused resources
        isDebuggable = false             // never ship debuggable release
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

### 3. Build release AAB (not APK)

```bash
# Play Store requires AAB since Aug 2021
./gradlew bundleProdRelease

# Output: app/build/outputs/bundle/prodRelease/app-prod-release.aab
```

### 4. Target API level — must meet Play Store requirements

```kotlin
// Play Store requires targetSdk within 1 year of latest Android release
// As of 2025: minimum targetSdk = 34, recommended = 35
defaultConfig {
    minSdk = 24
    targetSdk = 35    // must be current — Google enforces this
    compileSdk = 35
}
```

### 5. Data Safety form — required since 2022

```
Required declarations in Play Console → App content → Data safety:
  - What data your app collects (name, email, device ID, etc.)
  - Whether data is encrypted in transit
  - Whether users can request deletion
  - Whether data is shared with third parties
  
Failure to complete = app rejected
```

### 6. Content rating — required for all apps

```
Play Console → App content → Content ratings
  - Complete the IARC questionnaire
  - Rating applies globally (ESRB, PEGI, etc.)
  - Get rating BEFORE submitting for review
```

### 7. Store listing requirements

```
App icon:       512×512 PNG, max 1MB, no alpha
Feature graphic: 1024×500 PNG/JPG, required for featured placement
Screenshots:    2-8 per form factor (phone, tablet)
                Phone: 1080×1920 or 1920×1080 minimum
                Tablet: 1920×1200 or 2560×1600 minimum
Short description: max 80 characters
Full description:  max 4000 characters
```

### 8. Release tracks — use the right one

```
Internal testing  → up to 100 testers, instant publish
Closed testing    → specific tester groups, review required
Open testing      → anyone can join, review required  
Production        → full rollout, review required (3-7 days first time)

✅ Strategy:
  1. Internal testing → get team feedback
  2. Closed alpha → beta testers
  3. Staged production rollout → 10% → 50% → 100%
```

### 9. App signing — use Play App Signing

```
Play Console → Setup → App integrity → Play App Signing
  - Google manages your release key
  - You upload with upload key (upload key compromise is recoverable)
  - Enables AAB optimization
  
✅ Enroll in Play App Signing BEFORE first release
❌ Managing your own release key = unrecoverable if lost
```

### 10. ProGuard mapping — upload for crash reports

```kotlin
// Upload mapping file so Crashlytics shows real stack traces
buildTypes {
    release {
        // mapping.txt generated at build/outputs/mapping/release/mapping.txt
        // Upload to Play Console → Android vitals → Deobfuscation files
        // Or configure Crashlytics auto-upload:
    }
}

// build.gradle.kts
plugins { id("com.google.firebase.crashlytics") }
firebaseCrashlytics {
    mappingFileUploadEnabled = true  // auto-uploads on release build
}
```

## Pre-launch checklist

- [ ] `isDebuggable = false` in release build type
- [ ] `isMinifyEnabled = true` and `isShrinkResources = true`
- [ ] `targetSdk = 35` (current requirement)
- [ ] `versionCode` incremented from last upload
- [ ] No test code or mock data in release build
- [ ] API keys point to production endpoints (not dev/staging)
- [ ] All permissions declared in manifest and justified in Data Safety
- [ ] Proguard rules preserve DTO classes for serialization
- [ ] All 3rd party SDK privacy policies added to Data Safety
- [ ] App tested on physical device with release build (`adb install`)
- [ ] Crash monitoring enabled (Firebase Crashlytics or similar)
- [ ] Analytics enabled for production

## Common Mistakes

❌ Uploading APK instead of AAB — rejected since 2021
❌ `isDebuggable = true` in release — security violation, rejected by Play
❌ Forgetting to increment versionCode — rejected, same version already uploaded
❌ targetSdk too old — Play Store rejection after grace period
❌ No mapping file upload — crash reports show obfuscated stack traces
❌ Incomplete Data Safety form — app removed from store
