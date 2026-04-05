---
name: datastore
description: |
  DataStore (Preferences and Proto) for Android AI agents. Use this skill whenever storing
  user preferences, settings, small key-value data, replacing SharedPreferences, using
  DataStore Preferences, DataStore Proto, reading/writing Flow from DataStore, Hilt DataStore
  injection, migration from SharedPreferences, or any persistent lightweight data storage.
  Always apply when the task involves user settings, theme preferences, onboarding state,
  auth tokens (non-secure), feature flags, or any small persistent data that is not a database.
---

# DataStore

DataStore is the modern replacement for SharedPreferences. Coroutine-based, type-safe, safe for Main thread.

## Preferences DataStore — for simple key-value pairs

```kotlin
// Setup
implementation(libs.androidx.datastore.preferences)
```

```kotlin
// ✅ Define all preference keys in one place
object PreferenceKeys {
    val IS_DARK_THEME = booleanPreferencesKey("is_dark_theme")
    val ONBOARDING_COMPLETE = booleanPreferencesKey("onboarding_complete")
    val USER_ID = stringPreferencesKey("user_id")
    val NOTIFICATION_ENABLED = booleanPreferencesKey("notifications_enabled")
    val LANGUAGE = stringPreferencesKey("language")
    val FONT_SIZE = intPreferencesKey("font_size")
}

// ✅ Hilt module — create DataStore singleton
@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {
    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
        PreferenceDataStoreFactory.create(
            corruptionHandler = ReplaceFileCorruptionHandler { emptyPreferences() },
            migrations = listOf(SharedPreferencesMigration(context, "legacy_prefs")),
            scope = CoroutineScope(Dispatchers.IO + SupervisorJob()),
            produceFile = { context.preferencesDataStoreFile("app_preferences") }
        )
}

// ✅ Repository pattern for DataStore
class UserPreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    // Read — returns Flow, auto-updates on change
    val isDarkTheme: Flow<Boolean> = dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences())
            else throw exception
        }
        .map { preferences -> preferences[PreferenceKeys.IS_DARK_THEME] ?: false }

    val onboardingComplete: Flow<Boolean> = dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { it[PreferenceKeys.ONBOARDING_COMPLETE] ?: false }

    // Read all preferences at once
    val userPreferences: Flow<UserPreferences> = dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { preferences ->
            UserPreferences(
                isDarkTheme = preferences[PreferenceKeys.IS_DARK_THEME] ?: false,
                notificationsEnabled = preferences[PreferenceKeys.NOTIFICATION_ENABLED] ?: true,
                language = preferences[PreferenceKeys.LANGUAGE] ?: "en",
                fontSize = preferences[PreferenceKeys.FONT_SIZE] ?: 16
            )
        }

    // Write — always suspend, safe on any coroutine
    suspend fun setDarkTheme(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.IS_DARK_THEME] = enabled
        }
    }

    suspend fun setOnboardingComplete() {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.ONBOARDING_COMPLETE] = true
        }
    }

    suspend fun updateLanguage(language: String) {
        dataStore.edit { preferences ->
            preferences[PreferenceKeys.LANGUAGE] = language
        }
    }

    suspend fun clearAll() {
        dataStore.edit { it.clear() }
    }
}

data class UserPreferences(
    val isDarkTheme: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val language: String = "en",
    val fontSize: Int = 16
)
```

## Proto DataStore — for complex structured data

```kotlin
// Setup
implementation(libs.androidx.datastore)
implementation(libs.protobuf.kotlin.lite)
```

```proto
// src/main/proto/user_settings.proto
syntax = "proto3";
option java_package = "com.company.app";
option java_multiple_files = true;

message UserSettings {
  bool dark_mode = 1;
  string language = 2;
  NotificationSettings notifications = 3;
  repeated string recent_searches = 4;
}

message NotificationSettings {
  bool enabled = 1;
  bool marketing = 2;
  bool updates = 3;
}
```

```kotlin
// ✅ Serializer for Proto DataStore
object UserSettingsSerializer : Serializer<UserSettings> {
    override val defaultValue: UserSettings = UserSettings.getDefaultInstance()

    override suspend fun readFrom(input: InputStream): UserSettings = try {
        UserSettings.parseFrom(input)
    } catch (e: InvalidProtocolBufferException) {
        throw CorruptionException("Cannot read proto", e)
    }

    override suspend fun writeTo(t: UserSettings, output: OutputStream) {
        t.writeTo(output)
    }
}

// ✅ Proto DataStore module
@Module
@InstallIn(SingletonComponent::class)
object ProtoDataStoreModule {
    @Provides
    @Singleton
    fun provideUserSettingsDataStore(@ApplicationContext context: Context): DataStore<UserSettings> =
        DataStoreFactory.create(
            serializer = UserSettingsSerializer,
            produceFile = { context.dataStoreFile("user_settings.pb") }
        )
}
```

## ViewModel — read DataStore in ViewModel

```kotlin
// ✅ Map DataStore Flow to UiState in ViewModel
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val prefsRepository: UserPreferencesRepository
) : ViewModel() {

    val uiState: StateFlow<SettingsUiState> = prefsRepository.userPreferences
        .map { prefs ->
            SettingsUiState.Success(
                isDarkTheme = prefs.isDarkTheme,
                notificationsEnabled = prefs.notificationsEnabled,
                language = prefs.language
            )
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = SettingsUiState.Loading
        )

    fun onDarkThemeToggled(enabled: Boolean) {
        viewModelScope.launch {
            prefsRepository.setDarkTheme(enabled)
        }
    }
}
```

## Migration from SharedPreferences

```kotlin
// ✅ Migrate automatically on first DataStore read
PreferenceDataStoreFactory.create(
    migrations = listOf(
        SharedPreferencesMigration(
            context = context,
            sharedPreferencesName = "legacy_prefs",
            keysToMigrate = setOf("is_dark_theme", "user_id")  // migrate specific keys only
        )
    ),
    produceFile = { context.preferencesDataStoreFile("app_preferences") }
)
```

## Common Mistakes

❌ Using `SharedPreferences` — always use DataStore in new code
❌ Reading DataStore with `.first()` on Main thread — observe as Flow in ViewModel
❌ Creating multiple DataStore instances for same file — always `@Singleton`
❌ No corruption handler — add `ReplaceFileCorruptionHandler { emptyPreferences() }`
❌ Storing large data in DataStore — use Room for lists/complex objects
❌ Calling `dataStore.edit {}` from Main thread — always from a coroutine
