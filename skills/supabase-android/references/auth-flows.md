# Auth Flows Reference

Full authentication patterns for Supabase Android.

---

## Email + Password

```kotlin
// Sign up
supabase.auth.signUpWith(Email) {
    email    = "user@example.com"
    password = "SecurePassword123!"
}

// Sign in
supabase.auth.signInWith(Email) {
    email    = "user@example.com"
    password = "SecurePassword123!"
}

// Password reset
supabase.auth.resetPasswordForEmail(email = "user@example.com")
```

---

## Google OAuth

### Setup steps
1. Add SHA-1 fingerprint in Google Cloud Console
2. Enable Google provider in Supabase dashboard → Authentication → Providers
3. Set redirect URL: `io.supabase.yourapp://login-callback`

```kotlin
// Sign in with Google
supabase.auth.signInWith(Google)

// AndroidManifest.xml — deep link for redirect
// <data android:scheme="io.supabase.yourapp" android:host="login-callback" />
```

---

## Session Management

```kotlin
// Observe session status — always use Flow, never poll
supabase.auth.sessionStatus
    .map { it is SessionStatus.Authenticated }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), false)

// SessionStatus variants:
// SessionStatus.Authenticated(session)    ← user logged in
// SessionStatus.NotAuthenticated          ← no session
// SessionStatus.LoadingFromStorage        ← reading from disk on app start
// SessionStatus.RefreshFailure(cause)     ← token refresh failed

// Get current user (null-safe)
val user = supabase.auth.currentUserOrNull()
val session = supabase.auth.currentSessionOrNull()
val userId = supabase.auth.currentUserOrNull()?.id

// Sign out
supabase.auth.signOut()
```

---

## Token Refresh

supabase-kt handles token refresh automatically when the JWT expires.
`RefreshFailure` is emitted only when the refresh itself fails (network error, revoked session).

```kotlin
// Handle refresh failure — force re-login
supabase.auth.sessionStatus
    .filterIsInstance<SessionStatus.RefreshFailure>()
    .onEach { failure ->
        Log.e("Auth", "Session refresh failed: ${failure.cause}")
        _events.emit(AppEvent.SessionExpired)
    }
    .launchIn(viewModelScope)
```

---

## Common Auth Errors

| Error | Cause | Fix |
|---|---|---|
| `AuthException: Invalid login credentials` | Wrong email/password | Show "Invalid credentials" to user |
| `AuthException: User already registered` | Email already exists | Redirect to sign in |
| `AuthException: Email not confirmed` | Verification not done | Show "Check your email" |
| OAuth redirect mismatch | Wrong redirect URL in Supabase dashboard | Match URL exactly: `io.supabase.yourapp://login-callback` |
| SHA-1 mismatch | Wrong fingerprint in Google Console | Re-add debug + release SHA-1 |
