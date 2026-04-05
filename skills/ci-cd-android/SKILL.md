---
name: ci-cd-android
description: |
  CI/CD pipeline for Android AI agents. Use this skill whenever setting up GitHub Actions
  for Android, automated testing in CI, APK/AAB build automation, Play Store deployment
  automation, Fastlane for Android, code quality checks in CI, lint in pipeline, unit test
  automation, instrumented test automation, Firebase Test Lab integration, code signing in CI,
  artifact upload, pull request checks, or any continuous integration/deployment for Android.
---

# CI/CD for Android

## GitHub Actions — complete workflow

```yaml
# .github/workflows/ci.yml
name: Android CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # cancel in-progress runs on new push

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - name: Run lint
        run: ./gradlew lint --continue
      - name: Upload lint results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: lint-results
          path: '**/build/reports/lint-results-*.html'

  unit-test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - name: Run unit tests
        run: ./gradlew testDebugUnitTest --continue
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: unit-test-results
          path: '**/build/test-results/**/*.xml'

  build:
    name: Build
    needs: [lint, unit-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - name: Build debug APK
        run: ./gradlew assembleProdDebug
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: debug-apk
          path: app/build/outputs/apk/prod/debug/*.apk

  deploy-internal:
    name: Deploy to Internal Testing
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > keystore.jks
      - name: Build release AAB
        env:
          KEYSTORE_PATH: ${{ github.workspace }}/keystore.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew bundleProdRelease
      - name: Upload to Play Store (Internal)
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.company.app
          releaseFiles: app/build/outputs/bundle/prodRelease/*.aab
          track: internal
          status: completed
```

## Rule 2: Required secrets setup

```
GitHub Secrets needed:
  KEYSTORE_BASE64          → base64 of your .jks file: base64 -i keystore.jks | pbcopy
  KEYSTORE_PASSWORD        → keystore password
  KEY_ALIAS                → key alias
  KEY_PASSWORD             → key password
  PLAY_SERVICE_ACCOUNT_JSON → Google Play service account JSON with Editor permissions
```

## Rule 3: Gradle caching for faster CI

```yaml
# Add to every job that uses Gradle
- uses: gradle/actions/setup-gradle@v4
  with:
    cache-read-only: ${{ github.ref != 'refs/heads/main' }}
# Saves 3-5 minutes per run
```

## Rule 4: Instrumented tests on Firebase Test Lab

```yaml
- name: Run instrumented tests on Firebase Test Lab
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SERVICE_ACCOUNT_JSON }}
- run: |
    gcloud firebase test android run \
      --type instrumentation \
      --app app/build/outputs/apk/debug/*.apk \
      --test app/build/outputs/apk/androidTest/debug/*.apk \
      --device model=Pixel6,version=33 \
      --device model=Pixel_Tablet,version=33 \
      --timeout 15m
```

## Common Mistakes

❌ Committing keystore or passwords — always use GitHub Secrets
❌ No `concurrency:` group — multiple PRs queue up unnecessarily
❌ Running tests before lint — lint is faster, fail fast
❌ No Gradle caching — every CI run downloads all dependencies
❌ Building unsigned APK for Play Store — AAB must be signed
❌ Uploading APK instead of AAB — Play Store requires AAB since 2021
