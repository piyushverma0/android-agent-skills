---
name: security
description: |
  Android app security for AI agents. Use this skill whenever implementing secure data storage,
  EncryptedSharedPreferences, EncryptedFile, Android Keystore, ProGuard/R8 code obfuscation,
  certificate pinning, network security config, root detection, SSL/TLS, token storage,
  preventing reverse engineering, securing API keys, BuildConfig secrets, environment variables,
  cleartext traffic, backup rules, screenshot prevention, overlay attack prevention, or any
  Android security hardening. Always apply when handling user credentials, payments, or PII.
---

# Android Security

## Rule 1: Never store secrets in source code or BuildConfig

```kotlin
// ❌ Never — committed to git, visible in APK
const val API_KEY = "sk-1234567890abcdef"
buildConfigField("String", "API_KEY", "\"sk-1234567890abcdef\"")

// ✅ Use local.properties (gitignored) + build script injection
// local.properties (never commit this file)
// API_KEY=sk-1234567890abcdef

// build.gradle.kts
val apiKey = gradleLocalProperties(rootDir, providers).getProperty("API_KEY") ?: ""
buildConfigField("String", "API_KEY", "\"$apiKey\"")

// ✅ Better: use server-side proxy — never expose API keys in app at all
// Client → Your backend → Third-party API
```

## Rule 2: Encrypted storage for sensitive data

```kotlin
// ✅ EncryptedSharedPreferences for tokens, session data
class SecureStorageImpl @Inject constructor(
    @ApplicationContext context: Context
) : SecureStorage {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    override fun saveToken(token: String) {
        encryptedPrefs.edit().putString("auth_token", token).apply()
    }

    override fun getToken(): String? = encryptedPrefs.getString("auth_token", null)

    override fun clearAll() = encryptedPrefs.edit().clear().apply()
}
```

## Rule 3: Network Security Config

```xml
<!-- res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Block all cleartext traffic in production -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <!-- Allow cleartext only for debug -->
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />  <!-- allow Charles/mitmproxy in debug -->
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

```xml
<!-- AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false">
```

## Rule 4: Certificate pinning

```kotlin
// ✅ OkHttp certificate pinning for high-security apps
val certificatePinner = CertificatePinner.Builder()
    .add("api.myapp.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")  // leaf
    .add("api.myapp.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")  // backup
    .build()

OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

## Rule 5: Prevent screenshots and screen recording

```kotlin
// ✅ Prevent screenshots on sensitive screens (banking, passwords)
@Composable
fun SecureScreen(content: @Composable () -> Unit) {
    val activity = LocalContext.current as? Activity
    DisposableEffect(Unit) {
        activity?.window?.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        onDispose {
            activity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
    content()
}
```

## Rule 6: Backup rules — exclude sensitive files

```xml
<!-- res/xml/backup_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="secure_prefs.xml" />
    <exclude domain="database" path="app_database" />
    <exclude domain="file" path="." />
</full-backup-content>

<!-- AndroidManifest.xml -->
<application
    android:allowBackup="false"
    android:dataExtractionRules="@xml/backup_rules">
```

## Common Mistakes

❌ Storing tokens in plain SharedPreferences — use EncryptedSharedPreferences
❌ API keys in BuildConfig — visible by decompiling APK
❌ `android:allowBackup="true"` without backup rules — sensitive DB backed up to Google
❌ `android:usesCleartextTraffic="true"` in production — all traffic unencrypted
❌ Logging tokens or PII in debug — `Log.d("token", userToken)` visible in logcat
❌ No root detection for banking/payment apps — use Play Integrity API
