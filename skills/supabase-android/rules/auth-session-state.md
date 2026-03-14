# Auth Session State — Observe sessionStatus, Never Poll

**Impact: CRITICAL**

Polling `currentUserOrNull()` in a loop or checking auth state in composables
causes stale state, missed logouts, and battery drain.
Session state must be observed as a Flow.

## Rule

### 1. Observe sessionStatus in ViewModel

```kotlin
// ✅ Session state as StateFlow — reacts to login/logout automatically
@HiltViewModel
class AuthViewModel @Inject constructor(
    private val supabase: SupabaseClient
) : ViewModel() {

    val isAuthenticated: StateFlow<Boolean> = supabase.auth.sessionStatus
        .map { status -> status is SessionStatus.Authenticated }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = false
        )

    // Full session status for nuanced handling
    val sessionStatus: StateFlow<SessionStatus> = supabase.auth.sessionStatus
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000),
            SessionStatus.LoadingFromStorage)
}
```

### 2. Handle all session states

```kotlin
// ✅ Handle every SessionStatus variant
val sessionStatus by viewModel.sessionStatus.collectAsStateWithLifecycle()

when (sessionStatus) {
    is SessionStatus.Authenticated      -> MainApp()
    is SessionStatus.NotAuthenticated   -> LoginScreen()
    is SessionStatus.LoadingFromStorage -> SplashScreen()   // ← loading from disk
    is SessionStatus.RefreshFailure     -> {                // ← token refresh failed
        LoginScreen()
        viewModel.showSessionExpiredMessage()
    }
}
```

### 3. Sign in flows

```kotlin
// ✅ Email + password
suspend fun signInWithEmail(email: String, password: String) {
    supabase.auth.signInWith(Email) {
        this.email    = email
        this.password = password
    }
}

// ✅ Google OAuth
suspend fun signInWithGoogle() {
    supabase.auth.signInWith(Google)
}

// ✅ Sign out — clears session from disk too
suspend fun signOut() {
    supabase.auth.signOut()
}

// ✅ Get current user safely
val user = supabase.auth.currentUserOrNull()    // null if not authenticated
val session = supabase.auth.currentSessionOrNull()
```

### 4. Deep link handling for OAuth (AndroidManifest)

```xml
<!-- AndroidManifest.xml — required for Google OAuth redirect -->
<activity android:name=".ui.MainActivity">
    <intent-filter android:label="@string/app_name">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- Must match your Supabase redirect URL -->
        <data android:scheme="io.supabase.yourapp" android:host="login-callback" />
    </intent-filter>
</activity>
```

## Anti-Patterns

```kotlin
// ❌ Polling — misses state changes, wastes battery
while (true) {
    val user = supabase.auth.currentUserOrNull()
    delay(1000)
}

// ❌ Checking auth in composable — runs on every recomposition
@Composable fun Screen() {
    val user = supabase.auth.currentUserOrNull()  // ❌ side effect in composition
}

// ❌ Not handling LoadingFromStorage — blank screen flash on app open
when (sessionStatus) {
    is SessionStatus.Authenticated    -> MainApp()
    is SessionStatus.NotAuthenticated -> LoginScreen()
    // ❌ missing LoadingFromStorage → shows wrong screen briefly on cold start
}
```
