# android-agent-skills

> I was getting 5× token bills every month building Android apps with AI agents.  
> Same errors. Same Supabase crashes. Same broken screens.  
> I fixed it by writing these 27 skills.  
> Now my bills dropped 5×. [FitGenZ AI](https://play.google.com/store/apps/details?id=com.fitgenz) shipped in 18 days.

<p align="center">
  <a href="https://github.com/piyushverma0/android-agent-skills/stargazers">
    <img src="https://img.shields.io/github/stars/piyushverma0/android-agent-skills?style=flat-square&color=22c55e" alt="Stars"/>
  </a>
  <img src="https://img.shields.io/badge/skills-27-3b82f6?style=flat-square" alt="27 skills"/>
  <img src="https://img.shields.io/badge/rules-180%2B-f59e0b?style=flat-square" alt="180+ rules"/>
  <img src="https://img.shields.io/badge/bills_reduced-5×-ef4444?style=flat-square" alt="5x less bills"/>
  <img src="https://img.shields.io/badge/Kotlin-2.0%2B-7F52FF?style=flat-square&logo=kotlin" alt="Kotlin 2.0+"/>
  <img src="https://img.shields.io/badge/license-MIT-8b5cf6?style=flat-square" alt="MIT"/>
</p>

---

## The honest story — Seekho AI broke my budget

I'm Piyush. I build Android apps solo using AI agents — Claude Code, Codex, Cursor, Antigravity.

My first serious Android project was **Seekho AI** — an app that helps Indians find government schemes, exam notifications, and jobs. The idea was solid. The execution was a nightmare.

Every AI session started the same way. I'd describe what I wanted. The agent would start building. And within 20 minutes, I was correcting the same mistakes I'd corrected the session before.

Here's exactly what was happening to my token budget:

---

### The 5 problems that were killing my token budget

**Problem 1: Every screen looked different from the last one**

The agent had no memory of how I built screen 1 when it started screen 2. Different spacing on every card. `fontSize = 18.sp` here, `fontSize = 20.sp` there. `Color(0xFF1A1A2E)` in one file, `Color(0xFF161622)` in the next. `Modifier.padding(12.dp)` on this screen, `Modifier.padding(16.dp)` on that one.

By the time I had 8 screens, the app looked like it was designed by 8 different people. I'd spend the first 15-20 minutes of every new session re-explaining my color palette, my spacing, my card style. Every. Single. Session.

Token waste: easily 800-1200 tokens per session just re-establishing visual context.

**Problem 2: Supabase auth broke in production, not in dev**

This one cost me a week and probably ₹3,000 in tokens trying to debug it.

The agent kept writing this:

```kotlin
// What agents write without the supabase-android skill
val client = createSupabaseClient(url, anonKey) {
    install(Auth)   // ← persistSession defaults to true
}
val user = client.auth.currentUserOrNull()  // ← returns null after hot restart
```

Everything looked fine in development. The moment Seekho AI users tried to call an Edge Function with their JWT, they got `UnauthorizedRestException`. Every time. 

I described the error to the agent. It wrote a fix. The fix introduced a different bug. I described that. It fixed that. Three sessions of back-and-forth, hundreds of messages, just to discover one missing flag:

```kotlin
// The actual fix — one line
install(Auth) {
    persistSession = false   // ← without this, getUser() returns null
}
```

Token waste: 3 full debugging sessions that shouldn't have happened.

**Problem 3: Hilt compile errors that the agent couldn't read**

Dagger error messages are famously cryptic. The agent would write `@Provides` where `@Binds` was needed, put a `@Singleton`-scoped dependency inside a narrower scope, or forget `@AndroidEntryPoint` on an Activity. The Dagger compile error would come back as 40 lines of incomprehensible text.

The agent's response was to try a fix. Usually wrong. Try another fix. Still wrong. Third try, sometimes right. Sometimes it introduced a new error instead.

For Seekho AI, I had 6 Hilt modules. Getting them right took approximately 4 debugging cycles each.

Token waste: 200-400 tokens per Hilt error that should have been avoided with the right pattern upfront.

**Problem 4: `kapt` instead of `ksp` — every single time**

Without fail, every new project the agent would write:

```kotlin
// What agents write without the gradle skill
plugins {
    kotlin("kapt")   // ← 2× slower than ksp, deprecated
}
kapt(libs.hilt.compiler)
kapt(libs.room.compiler)
```

I'd catch it. Fix it. Next session, same thing. It wasn't learning because I wasn't teaching it systematically. So every new module = one kapt→ksp fix cycle.

**Problem 5: `collectAsState()` instead of `collectAsStateWithLifecycle()`**

This one doesn't just waste tokens — it wastes battery. The agent kept writing code that collected Flows even when the app was backgrounded. I'd explain the correct API. It'd write it right for that session. Next session: wrong again.

---

### The token math

By month 3 of building Sarkari Khozo, I did a rough calculation:

| Repeating waste per session | Avg tokens | Sessions/month |
|---|---|---|
| Re-explaining color/spacing system | ~1,000 | 20 |
| Debugging Supabase auth from scratch | ~2,500 | 3 |
| Fixing Hilt errors that should've been right | ~400 | 8 |
| kapt→ksp correction cycle | ~200 | 10 |
| collectAsState → lifecycle fix | ~150 | 15 |
| Wrong UiState pattern (no loading/error/empty states) | ~800 | 12 |

**That's roughly 50,000+ tokens/month in pure waste.** Not building new features. Just correcting the same mistakes over and over because the agent had no memory of the right patterns.

My billing was 5× what it should have been. I hit token limit alerts constantly. I started dreading opening the project.

---

## The fix — FitGenZ AI shipped in 18 days, 5× lower bills

After Sarkari Khozo taught me what was broken, I spent 2 weeks writing down every pattern the agent needed to know — as skills it could read automatically.

Then I started **FitGenZ AI** — a Gen-Z fitness app with AI food tracking, calorie goals, streak tracking, and an AI coach. Way more complex than Sarkari Khozo.

**It shipped in 18 days. My billing dropped by 5×.**

Not because I got faster. Because the agent stopped making the same mistakes.

The first session, instead of re-explaining my design system, I just built. The agent read `design-system` and applied the right spacing, the right typography, the right surface colors automatically.

When I integrated Supabase auth, it worked first try. No `UnauthorizedRestException`. No 3-session debugging spiral.

When I set up Hilt, the modules were right. `@Binds` where it should be `@Binds`. `ksp` in every build file.

When I needed `StateFlow` collected in the UI, it wrote `collectAsStateWithLifecycle()`. Without being asked.

Every screen looked like it belonged in the same app. Because the design tokens were consistent across every composable.

---

## Install in 30 seconds

### 🤖 If you're an AI agent — self-install

Paste the right instruction into your agent and it will install everything automatically:

**Claude Code:**
```
Fetch and follow: https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.claude/INSTALL.md
```

**OpenAI Codex:**
```
Fetch and follow: https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.codex/INSTALL.md
```

**Cursor:**
```
Fetch and follow: https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.cursor/INSTALL.md
```

**Antigravity:**
```
Fetch and follow: https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.antigravity/INSTALL.md
```

**Any other agent:**
```
Fetch https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/AGENTS.md
and follow the installation instructions for your platform.
```

---

### 👨‍💻 Developer — CLI

```bash
# Global install — all 27 skills, all your Android projects
npx android-agent-skills install --global

# Just this project
npx android-agent-skills install

# Specific skills only
npx android-agent-skills install --skills design-system,supabase-android,hilt-di

# For a specific agent
npx android-agent-skills install --agent claude-code
npx android-agent-skills install --agent codex
npx android-agent-skills install --agent cursor
npx android-agent-skills install --agent '*'

# Update
npx android-agent-skills update
```

---

### 🔧 Manual — no tools needed

```bash
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git

# Copy to your agent — pick one
cp -r android-agent-skills/skills/* ~/.claude/skills/   # Claude Code (global)
cp -r android-agent-skills/skills/* .claude/skills/     # Claude Code (project)
cp -r android-agent-skills/skills/* ~/.codex/skills/    # Codex
cp -r android-agent-skills/skills/* ~/.cursor/skills/   # Cursor
cp -r android-agent-skills/skills/* .github/skills/     # Copilot / universal
```

---

### 📂 Install paths by agent

| Agent | Global | Project |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| OpenAI Codex | `~/.codex/skills/` | `.codex/skills/` |
| Cursor | `~/.cursor/skills/` | `.cursor/skills/` |
| Antigravity | `~/.antigravity/skills/` | `.antigravity/skills/` |
| GitHub Copilot | — | `.github/skills/` |
| Gemini CLI | `~/.gemini/skills/` | `.gemini/skills/` |
| Windsurf | `~/.windsurf/skills/` | `.windsurf/skills/` |
| OpenCode | `~/.config/opencode/skill/` | `.opencode/skill/` |

---

### ✅ Verify it worked

Open a new session and type:

```
Add Supabase auth with email/password to my Android app
```

The agent should automatically apply `supabase-android` + `hilt-di` + `android-architecture` — writing `persistSession = false`, the correct `getUser(jwt)` pattern, a Hilt module with `@Binds`, and a sealed `AuthState` — without you explaining any of it.

---

## What these skills fix — the real problems

### 🔴 Design inconsistency — the silent token killer

Without the `design-system` skill, agents write this across your codebase:

```kotlin
// Screen 1 — HomeScreen.kt
Text("Title", fontSize = 20.sp, color = Color(0xFF1A1A2E))
Card(modifier = Modifier.padding(12.dp))

// Screen 2 — ProfileScreen.kt (different session)
Text("Title", fontSize = 18.sp, color = Color(0xFF161622))  // slightly different!
Card(modifier = Modifier.padding(16.dp))                     // different padding!

// Screen 3 — SettingsScreen.kt (yet another session)
Text("Title", fontSize = 22.sp, fontWeight = FontWeight.Bold)
Box(modifier = Modifier.padding(14.dp))                      // 14dp?? where did this come from
```

Every session starts with zero visual memory. The agent doesn't know what your last screen looked like.

With `design-system`, the agent reads these tokens once and applies them everywhere:

```kotlin
// Every screen, every session — consistent
Text("Title", style = MaterialTheme.typography.titleLarge)
AppCard { content() }  // always the same padding, shape, surface color
Spacer(Modifier.height(Spacing.md))  // always 16dp
```

No re-explaining. No inconsistent screens. No cleanup pass at the end.

---

### 🔴 Supabase `UnauthorizedRestException` — the production crash

Without `supabase-android`, agents write this:

```kotlin
// Looks fine in dev, breaks in production
val client = createSupabaseClient(url, anonKey) {
    install(Auth)  // persistSession = true by default
}
// After hot restart: currentUserOrNull() returns null
// JWT passed to Edge Function: UnauthorizedRestException
```

Your users see crashes. You spend hours debugging. The agent tries 3 different fixes before finding the right one.

With `supabase-android`, the agent writes this the first time:

```kotlin
// Correct — no debugging session needed
val client = createSupabaseClient(url, anonKey) {
    install(Auth) {
        persistSession = false   // required when passing JWT to Edge Functions
    }
}
val user = client.auth.getUser(jwt)  // pass jwt directly
```

---

### 🔴 Hilt compile errors — the 3-try debugging loop

Without `hilt-di`, agents write:

```kotlin
// ❌ @Provides where @Binds is needed — slower, causes issues
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    @Provides @Singleton
    fun provideRepo(impl: ItemRepositoryImpl): ItemRepository = impl
}

// ❌ Wrong scope — Singleton injected into ActivityScoped = Dagger crash
@ActivityScoped
class SomeViewModel @Inject constructor(
    private val repo: ItemRepository  // @Singleton — scope mismatch
)
```

With `hilt-di`, the agent writes it right the first time:

```kotlin
// ✅ @Binds — correct, efficient, no scope mismatch
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton
    abstract fun bindRepo(impl: ItemRepositoryImpl): ItemRepository
}
```

---

### 🔴 `kapt` in 2026 — the slow build loop

Without `gradle`, agents still write `kapt` in 2026:

```kotlin
// ❌ Every session, every new module
plugins { kotlin("kapt") }
kapt(libs.hilt.compiler)
kapt(libs.room.compiler)
// Builds 2× slower. Deprecated. Causes issues with newer Kotlin.
```

With `gradle`:

```kotlin
// ✅ Always ksp — first time, every time
plugins { alias(libs.plugins.ksp) }
ksp(libs.hilt.compiler)
ksp(libs.room.compiler)
```

---

### 🔴 Missing UiState states — the invisible crash

Without `compose-ui`, agents write:

```kotlin
// ❌ No loading state, no error state, no empty state
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val items by viewModel.items.collectAsState()  // ← wrong API, no lifecycle
    LazyColumn {
        items(items) { ItemCard(it) }
    }
    // What shows while items are loading? Nothing. Blank screen.
    // What shows if loading fails? Nothing. Blank screen.
    // What shows if items list is empty? Nothing. Blank screen.
}
```

With `compose-ui`:

```kotlin
// ✅ Every state handled, correct API
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
when (uiState) {
    is Loading -> AppLoadingScreen()
    is Empty   -> AppEmptyScreen("No items yet", "Add your first item to get started")
    is Success -> ItemList(uiState.items)
    is Error   -> AppErrorScreen(uiState.message, onRetry = viewModel::load)
}
```

---

### 🔴 `Room` without migrations — silent data loss

Without `room-database`, agents write:

```kotlin
// ❌ destroys user data on every schema change
Room.databaseBuilder(context, AppDatabase::class.java, "db")
    .fallbackToDestructiveMigration()  // ← wipes database when schema changes
    .build()
```

With `room-database`:

```kotlin
// ✅ Explicit migrations — user data is safe
Room.databaseBuilder(context, AppDatabase::class.java, "db")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()
```

---

### 🔴 No tests — the Play Store rejection risk

Without `android-testing`, agents ship with zero tests. Play Store doesn't reject you for this directly, but your crash rate will be high enough to trigger policy review. Also: every refactor breaks something and you don't know it until users report it.

With `android-testing`, the agent writes `FakeItemRepository`, `MainDispatcherRule`, and ViewModel tests alongside the feature — not as an afterthought.

---

## The 27 skills — what each one does

### Tier 1 — Foundation (fixes the most expensive mistakes)

| Skill | What it fixes | Where it applies |
|---|---|---|
| [`android-setup`](skills/android-setup/SKILL.md) | Wrong SDK versions, `kapt` instead of `ksp`, no version catalog | `build.gradle.kts`, `settings.gradle.kts`, `libs.versions.toml` |
| [`compose-ui`](skills/compose-ui/SKILL.md) | Missing UiState states, `collectAsState()` instead of lifecycle-aware, Scaffold padding ignored | Every `@Composable` screen file |
| [`android-architecture`](skills/android-architecture/SKILL.md) | DTOs leaking to UI, ViewModel calling Room directly, no `Result<T>` | `ViewModel.kt`, `Repository.kt`, `UseCase.kt` |
| [`hilt-di`](skills/hilt-di/SKILL.md) | `@Provides` vs `@Binds`, scope errors, Dagger compile errors | Every `@Module`, `@HiltViewModel`, `@AndroidEntryPoint` |
| [`kotlin-patterns`](skills/kotlin-patterns/SKILL.md) | `GlobalScope`, `!!` operator, wrong dispatcher, `var` in data class | Any `.kt` file with coroutines or Flow |

### Tier 2 — UI System (consistency across every screen)

| Skill | What it fixes | Where it applies |
|---|---|---|
| [`design-system`](skills/design-system/SKILL.md) | Different spacing/colors/typography per screen, no dark mode, hardcoded values | `AppTheme.kt`, `DesignTokens.kt`, every component |
| [`adaptive-ui`](skills/adaptive-ui/SKILL.md) | No `NavigationSuiteScaffold`, broken layouts on different screen sizes | Every screen, `AppNavHost.kt` |
| [`material3`](skills/material3/SKILL.md) | Wrong M3 APIs, M2 components mixed in, drop shadows instead of tonal elevation | Any M3 component usage |
| [`compose-navigation`](skills/compose-navigation/SKILL.md) | String routes, no type safety, broken back navigation | `Routes.kt`, `AppNavHost.kt` |
| [`compose-animation`](skills/compose-animation/SKILL.md) | No skeleton loading, no transition animations, `tween(300)` for everything | Any animated screen |

### Tier 3 — Data Layer (no more production crashes)

| Skill | What it fixes | Where it applies |
|---|---|---|
| [`room-database`](skills/room-database/SKILL.md) | `fallbackToDestructiveMigration`, no `@Upsert`, `kapt` for Room compiler | `@Entity`, `@Dao`, `@Database` files |
| [`retrofit`](skills/retrofit/SKILL.md) | Non-suspend functions, untyped errors, hardcoded base URL | `ApiService.kt`, `NetworkModule.kt` |
| [`datastore`](skills/datastore/SKILL.md) | `SharedPreferences` in new code, multiple instances, no corruption handler | `UserPreferencesRepository.kt` |
| [`offline-first`](skills/offline-first/SKILL.md) | UI showing network response directly, no cache fallback, no retry | Repository sync logic |

### Tier 4 — Platform Features

| Skill | What it fixes | Where it applies |
|---|---|---|
| [`supabase-android`](skills/supabase-android/SKILL.md) | `UnauthorizedRestException`, `persistSession` bug, wrong JWT pattern | `SupabaseModule.kt`, auth code |
| [`firebase`](skills/firebase/SKILL.md) | No BoM, missing `.await()`, no offline persistence | `FirebaseModule.kt`, Firestore queries |
| [`permissions`](skills/permissions/SKILL.md) | No rationale dialog, permanent deny not handled | Any permission request screen |
| [`notifications`](skills/notifications/SKILL.md) | Channel not created, wrong `PendingIntent` flags | `NotificationHelper.kt` |
| [`camerax`](skills/camerax/SKILL.md) | `ImageProxy` not closed, wrong executor | Camera screen, QR scanner |
| [`biometrics`](skills/biometrics/SKILL.md) | `BiometricPrompt` in Composable, wrong flags | `MainActivity.kt` biometric setup |

### Tier 5 — Quality & Security

| Skill | What it fixes | Where it applies |
|---|---|---|
| [`android-testing`](skills/android-testing/SKILL.md) | No tests, no `MainDispatcherRule`, `runBlocking` in tests | Every `*Test.kt` file |
| [`performance`](skills/performance/SKILL.md) | `List<T>` instead of stable list, computation in composition | `@Stable`/`@Immutable` annotations |
| [`security`](skills/security/SKILL.md) | API keys in `BuildConfig`, plain `SharedPreferences` for tokens | `SecureStorage.kt`, build config |
| [`accessibility`](skills/accessibility/SKILL.md) | Missing `contentDescription`, no semantics | Semantics modifiers on Composables |
| [`gradle`](skills/gradle/SKILL.md) | Versions hardcoded, `kapt`, no build cache | All `build.gradle.kts` files |

### Tier 6 — Release

| Skill | What it fixes | Where it applies |
|---|---|---|
| [`ci-cd-android`](skills/ci-cd-android/SKILL.md) | No test automation, APK instead of AAB, credentials in code | `.github/workflows/ci.yml` |
| [`play-store-release`](skills/play-store-release/SKILL.md) | `isDebuggable = true`, no Data Safety form, wrong `targetSdk` | Release build config |

---

## How skills work — no prompting needed

Each skill has a `description` field with exact trigger keywords. The agent matches them automatically when it reads your task.

```
You type:   "Add Supabase login to my app"

Agent sees: supabase-android → matches "Auth, persistSession, getUser(jwt)"
            hilt-di          → matches "@HiltViewModel, @Module"
            android-architecture → matches "ViewModel, UiState, Repository"

Agent loads: All three skills

Agent writes: persistSession = false, correct JWT flow, @Binds Hilt module,
              sealed AuthState, no UnauthorizedRestException — first try
```

### Context cost — 27 skills in context, minimal impact

```
Level 1 (always active): skill name + description  ≈ 50 tokens each
Level 2 (loads on trigger): full SKILL.md          ≈ 2,000 tokens
Level 3 (loads on demand): references/             ≈ 500-1,500 tokens
```

All 27 skills at level 1 = ~1,350 tokens total — a rounding error in your context window. The full rules only load when triggered.

### Manual invoke

```
/supabase-android     # Claude Code
/hilt-di
/android-testing

# Or in a prompt:
"Using the design-system skill, create a consistent card for this screen"
```

---

## Skill file structure

```
skills/<skill-name>/
├── SKILL.md           ← agent reads this on trigger
│                        rules + ✅ correct code + ❌ wrong code + anti-patterns
├── metadata.json      ← version, SDK targets
├── rules/             ← individual rule source files
└── references/        ← deep-dive files loaded only when needed
    └── topic.md       ← e.g., hilt-testing.md, supabase-auth-patterns.md
```

---

## Contributing

These skills fix real mistakes from real projects. If you've built an Android app with AI and hit a recurring mistake that's not covered here — write the skill.

```bash
git clone https://github.com/piyushverma0/android-agent-skills
cd android-agent-skills

mkdir -p skills/your-skill-name/rules
mkdir -p skills/your-skill-name/references
# Write SKILL.md following the format in AGENTS.md
# Every rule needs: ✅ correct, ❌ wrong, "Common Mistakes" section

git checkout -b feat/your-skill-name
git commit -m "feat(your-skill-name): add skill"
git push && open PR
```

**Skills I need most:**
`room-paging` · `maps-compose` · `in-app-purchase` · `widgets-glance` · `media3-player` · `mlkit-text-recognition` · `workmanager-advanced` · `bluetooth-le`

See [CONTRIBUTING.md](CONTRIBUTING.md) for format requirements.

---

## Updates

```bash
npx android-agent-skills update

# Manual
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && cp -r /tmp/aas/skills/* ~/.claude/skills/ \
  && rm -rf /tmp/aas
```

---

## License

MIT.

---

*Built by [Piyush Verma](https://github.com/piyushverma0).*  
*Solo Android builder from Banda, UP.*  
*I got tired of 5× token bills. So I fixed the problem.*
