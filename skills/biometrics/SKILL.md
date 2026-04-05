---
name: biometrics
description: |
  Biometric authentication for Android AI agents. Use this skill whenever implementing
  fingerprint authentication, face unlock, biometric login, BiometricPrompt, BiometricManager,
  CryptoObject, Keystore encryption with biometrics, Class 2 vs Class 3 biometrics,
  biometric availability check, fallback to PIN/pattern, secure credential storage,
  or any biometric/fingerprint/face authentication flow in Android.
---

# Biometric Authentication

## Rule 1: Check availability before showing biometric UI

```kotlin
// ✅ Check what's available before prompting
fun BiometricManager.canAuthenticateWithBiometrics(): Boolean {
    val authenticators = BIOMETRIC_STRONG or DEVICE_CREDENTIAL
    return canAuthenticate(authenticators) == BiometricManager.BIOMETRIC_SUCCESS
}

// ✅ Detailed availability check
sealed interface BiometricAvailability {
    data object Available : BiometricAvailability
    data object NoHardware : BiometricAvailability
    data object NotEnrolled : BiometricAvailability
    data object Unavailable : BiometricAvailability
}

fun checkBiometricAvailability(context: Context): BiometricAvailability {
    val manager = BiometricManager.from(context)
    return when (manager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)) {
        BiometricManager.BIOMETRIC_SUCCESS -> BiometricAvailability.Available
        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
        BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> BiometricAvailability.NoHardware
        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> BiometricAvailability.NotEnrolled
        else -> BiometricAvailability.Unavailable
    }
}
```

## Rule 2: BiometricPrompt — correct setup in ComponentActivity

```kotlin
// ✅ Must be created in Activity, not in Composable
class MainActivity : ComponentActivity() {
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupBiometrics()
        setContent { MyApp(onAuthenticateClick = ::showBiometricPrompt) }
    }

    private fun setupBiometrics() {
        val executor = ContextCompat.getMainExecutor(this)
        biometricPrompt = BiometricPrompt(this, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                // Handle success — result.cryptoObject available if using CryptoObject
                viewModel.onBiometricSuccess()
            }
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                if (errorCode != BiometricPrompt.ERROR_USER_CANCELED &&
                    errorCode != BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                    viewModel.onBiometricError(errString.toString())
                }
            }
            override fun onAuthenticationFailed() {
                // Biometric recognized but not matched — DO NOT lock out here
                // BiometricPrompt handles lockout automatically
            }
        })

        promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Authenticate")
            .setSubtitle("Use your biometric to unlock the app")
            .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            // Don't set setNegativeButtonText when DEVICE_CREDENTIAL is allowed
            .build()
    }

    fun showBiometricPrompt() {
        biometricPrompt.authenticate(promptInfo)
    }
}
```

## Rule 3: Crypto-backed biometrics for secure key operations

```kotlin
// ✅ Biometric-protected Keystore key
object BiometricCryptoHelper {
    private const val KEY_NAME = "biometric_key"

    fun generateKey() {
        val keyGen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        keyGen.init(
            KeyGenParameterSpec.Builder(KEY_NAME,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                .setUserAuthenticationRequired(true)
                .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
                .setInvalidatedByBiometricEnrollment(true)
                .build()
        )
        keyGen.generateKey()
    }

    fun getCipher(): Cipher {
        val key = KeyStore.getInstance("AndroidKeyStore").run {
            load(null)
            getKey(KEY_NAME, null) as SecretKey
        }
        return Cipher.getInstance("${KeyProperties.KEY_ALGORITHM_AES}/${KeyProperties.BLOCK_MODE_CBC}/${KeyProperties.ENCRYPTION_PADDING_PKCS7}").apply {
            init(Cipher.ENCRYPT_MODE, key)
        }
    }
}

// Authenticate with CryptoObject for maximum security
fun showSecureBiometricPrompt() {
    val cipher = BiometricCryptoHelper.getCipher()
    biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
}
```

## Common Mistakes

❌ Creating BiometricPrompt in Composable — create in Activity, pass lambda to Compose
❌ Setting `setNegativeButtonText` when `DEVICE_CREDENTIAL` is allowed — crash
❌ Not checking availability before showing prompt — shows broken UI on unsupported devices
❌ Locking user out on `onAuthenticationFailed` — BiometricPrompt handles lockout
❌ Using `BIOMETRIC_WEAK` for sensitive operations — use `BIOMETRIC_STRONG` with CryptoObject
