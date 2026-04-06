# android-agent-skills

> AI agents build Android apps that look broken on tablets, crash on Android 15,  
> have no design consistency, and ship with zero tests.  
> **This is the fix.**

<p align="center">
  <a href="https://github.com/piyushverma0/android-agent-skills/stargazers"><img src="https://img.shields.io/github/stars/piyushverma0/android-agent-skills?style=flat-square&color=green" alt="Stars"/></a>
  <img src="https://img.shields.io/badge/skills-27-blue?style=flat-square" alt="27 skills"/>
  <img src="https://img.shields.io/badge/rules-180%2B-orange?style=flat-square" alt="180+ rules"/>
  <img src="https://img.shields.io/badge/license-MIT-purple?style=flat-square" alt="MIT"/>
  <img src="https://img.shields.io/badge/Kotlin-2.0%2B-7F52FF?style=flat-square&logo=kotlin" alt="Kotlin 2.0+"/>
  <img src="https://img.shields.io/badge/M3_Expressive-2025-red?style=flat-square" alt="Material 3 Expressive"/>
</p>

---

## Why I built this

I'm Piyush — a solo Android builder from UP, India. I build entire apps using AI agents. And for a long time, app I shipped had the same problems:

- Layouts that looked broken on my tablet but fine on my phone
- Every screen with a different visual style, like five different designers worked on it
- `collectAsState()` instead of `collectAsStateWithLifecycle()` — every single time
- `kapt` instead of `ksp` — still, in 2026
- No tests. No CI. No idea if it would survive the Play Store review process

I got tired of correcting the same mistakes over and over. So I built a library of skills that teach AI agents the right way to build Android apps — once — and never look back.

This repo is the result: **27 skills, 180+ production rules, covering everything from the first `build.gradle.kts` to the Play Store submission checklist.**

If you build Android apps with AI agents, install this. Your agent will write better code, you'll spend less time fixing mistakes, and your users will get apps that actually work on their tablets.

---

## What AI agents get wrong without these skills

Here's what I see in every AI-generated Android codebase before installing these skills:

```kotlin
// What agents write without compose-ui skill:
Scaffold { _ ->                        // innerPadding ignored — content hides under nav bar
    LazyColumn {
        items(items) { ItemCard(it) }  // no stable key — full recompose on every change
    }
}

// What they write without adaptive-ui skill:
Column(modifier = Modifier.fillMaxWidth()) {
    ItemList(items)   // one stretched column, looks broken on 1000dp tablet
}

// What they write without design-system skill:
Text("Title", fontSize = 20.sp, color = Color(0xFF333333))  // hardcoded, breaks dark mode
Card(elevation = 8.dp) { ... }                               // M2 pattern in M3 world
```

And here's what they write **with** these skills installed:

```kotlin
// With compose-ui — every state handled, correct padding, lifecycle-aware
Scaffold { innerPadding ->
    when (uiState) {
        is Loading -> AppLoadingScreen()
        is Empty   -> AppEmptyScreen("No items", "Add your first item")
        is Success -> LazyColumn(contentPadding = innerPadding) {
            items(uiState.items, key = { it.id }) { ItemCard(it) }
        }
        is Error   -> AppErrorScreen(uiState.message, onRetry)
    }
}

// With adaptive-ui — one component, works everywhere automatically
ListDetailPaneScaffold(
    listPane   = { AnimatedPane { ItemList(onItemClick = { navigator.navigateTo(Detail, it) }) } },
    detailPane = { AnimatedPane { ItemDetail(navigator.currentDestination?.content) } }
)
// Phone: navigates between list and detail. Tablet: shows both side by side. Zero extra code.

// With design-system — M3 Expressive tokens, dark mode correct, consistent everywhere
Text("Title", style = MaterialTheme.typography.titleLarge)
Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh))
```

---

## Quick install

### 🤖 If you are an AI agent — fetch and follow

Paste the instruction for your platform into your agent, and it will self-install:

**Claude Code:**
```
Fetch and follow the instructions at:
https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.claude/INSTALL.md
```

**OpenAI Codex:**
```
Fetch and follow the instructions at:
https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.codex/INSTALL.md
```

**Cursor:**
```
Fetch and follow the instructions at:
https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.cursor/INSTALL.md
```

**Antigravity:**
```
Fetch and follow the instructions at:
https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/.antigravity/INSTALL.md
```

**Any other agent — universal instruction:**
```
Fetch https://raw.githubusercontent.com/piyushverma0/android-agent-skills/main/AGENTS.md
and follow the installation instructions for your platform.
```

---

### 👨‍💻 If you are a developer — CLI install

```bash
# All 27 skills, works across all your Android projects (recommended)
npx android-agent-skills install --global

# Just this project
npx android-agent-skills install

# Only specific skills
npx android-agent-skills install --skills adaptive-ui,design-system,android-testing

# For a specific agent
npx android-agent-skills install --agent claude-code
npx android-agent-skills install --agent codex
npx android-agent-skills install --agent cursor
npx android-agent-skills install --agent antigravity
npx android-agent-skills install --agent gemini
npx android-agent-skills install --agent '*'     # every agent at once

# Keep skills updated
npx android-agent-skills update
```

---

### 🔧 Manual install — no CLI, no tools needed

```bash
# Clone the repo
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git

# Pick your agent and copy
cp -r android-agent-skills/skills/* ~/.claude/skills/     # Claude Code (global)
cp -r android-agent-skills/skills/* .claude/skills/       # Claude Code (project)
cp -r android-agent-skills/skills/* ~/.codex/skills/      # Codex
cp -r android-agent-skills/skills/* ~/.cursor/skills/     # Cursor
cp -r android-agent-skills/skills/* .github/skills/       # GitHub Copilot
```

---

### 📂 Where skills go — by agent

| Agent | Global install path | Project-level path |
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

### ✅ Verify the install worked

Open a new session and type:

```
Create a screen with a list and a detail view that works on tablets too
```

Your agent should automatically use `adaptive-ui` + `compose-ui` + `android-architecture` — building a `ListDetailPaneScaffold` with proper `UiState`, `innerPadding`, and `collectAsStateWithLifecycle`. No extra prompting from you.

---

## How the skills work

### Automatic — no prompting needed

Each skill has a `description` field with exact trigger keywords. When you give the agent a task, it reads all installed skill descriptions and automatically loads the ones that match. You never need to say "use the skill."

```
You type:    "Create a sign-in screen with email and password"

Agent reads: compose-ui description → matches "@Composable, TextField"
             android-architecture → matches "ViewModel, UiState"
             hilt-di → matches "@HiltViewModel"
             design-system → matches "AppTextField, AppButton"

Agent loads: All four skills simultaneously

Agent writes: Correct Scaffold + TextField + PasswordVisualTransformation +
              sealed UiState + @HiltViewModel + AppTextField/AppButton components
              Dark mode correct. Loading state. Error state. No !! operators.
```

### Progressive loading — no context penalty

```
Level 1: skill name + description  →  always in context (≈50 tokens per skill)
Level 2: full SKILL.md body        →  loaded when triggered (≈2,000 tokens)
Level 3: references/ files         →  loaded on demand, only when needed
```

All 27 skills at Level 1 costs about **1,350 tokens total**. No performance impact.

### Manual invoke — when you want to be explicit

```
/compose-ui          ← Claude Code slash command
/adaptive-ui
/android-testing

# Or in a prompt:
"Using the design-system skill, build a consistent button component for my app"
"Apply android-testing to write tests for this ViewModel"
```

---

## The 27 skills — what each one covers

### Tier 1 — Foundation

These are the base skills. Every Android project needs all five.

| Skill | File it helps with | What it fixes |
|---|---|---|
| [`android-setup`](skills/android-setup/SKILL.md) | `build.gradle.kts`, `settings.gradle.kts`, `libs.versions.toml`, `AndroidManifest.xml` | KSP not kapt, version catalog, correct minSdk/targetSdk/compileSdk = 35, `enableEdgeToEdge()` |
| [`compose-ui`](skills/compose-ui/SKILL.md) | Every `@Composable` function, any screen file | Scaffold innerPadding ignored, `collectAsState` vs `collectAsStateWithLifecycle`, no UiState, missing loading/error/empty states |
| [`android-architecture`](skills/android-architecture/SKILL.md) | `ViewModel.kt`, `Repository.kt`, `UseCase.kt`, `UiState.kt` | ViewModel calling Room directly, DTOs leaking to UI, business logic in Composable, no Result<T> |
| [`hilt-di`](skills/hilt-di/SKILL.md) | Every `@Module`, `@HiltViewModel`, `@AndroidEntryPoint` class | `@Provides` when `@Binds` is right, wrong scopes, `kapt` instead of `ksp`, Dagger compile errors |
| [`kotlin-patterns`](skills/kotlin-patterns/SKILL.md) | Any `.kt` file with coroutines, Flow, or data modeling | `GlobalScope`, `!!` operator, `try/catch` in ViewModel, `var` in data class, wrong dispatcher |

---

### Tier 2 — UI System ★ the moat

This is what no other Android skills repo covers. I built these because AI agents in 2026 still build phone-only apps on a platform with 1B+ large-screen devices — and because every AI-built app looks like five different designers worked on it.

| Skill | File it helps with | What it fixes |
|---|---|---|
| [`adaptive-ui`](skills/adaptive-ui/SKILL.md) | Every screen, `MainActivity.kt`, `AppNavHost.kt` | Phone-only layouts, no `NavigationSuiteScaffold`, no `ListDetailPaneScaffold`, broken tablet UI, ignoring foldables |
| [`design-system`](skills/design-system/SKILL.md) | `AppTheme.kt`, `DesignTokens.kt`, `AppButton.kt`, `AppCard.kt`, `AppTextField.kt` | Hardcoded `13.dp` spacing, `fontSize = 20.sp`, `Color(0xFF333333)`, no dark mode, no M3 Expressive motion tokens |
| [`material3`](skills/material3/SKILL.md) | Any screen using M3 components | Wrong M3 APIs, drop shadows instead of tonal elevation, M2 components mixed with M3, missing scroll behavior on `LargeTopAppBar` |
| [`compose-navigation`](skills/compose-navigation/SKILL.md) | `Routes.kt`, `AppNavHost.kt` | String routes, no `@Serializable` types, missing `launchSingleTop`, no shared element transitions, no predictive back |
| [`compose-animation`](skills/compose-animation/SKILL.md) | Any animated component, `Shimmer.kt`, loading states | `tween(300)` for spatial motion (should be spring), no skeleton loading, no `AnimatedContent` on state transitions |

---

### Tier 3 — Data Layer

| Skill | File it helps with | What it fixes |
|---|---|---|
| [`room-database`](skills/room-database/SKILL.md) | `@Entity`, `@Dao`, `@Database`, migration files | `@Insert` without `OnConflictStrategy`, no `@Upsert`, missing migrations, `kapt` instead of `ksp` for Room compiler |
| [`retrofit`](skills/retrofit/SKILL.md) | `ApiService.kt`, `NetworkModule.kt`, DTO classes | Non-suspend functions, catching generic `Exception`, no `ignoreUnknownKeys`, hardcoded base URL, no timeout |
| [`datastore`](skills/datastore/SKILL.md) | `UserPreferencesRepository.kt`, `DataStoreModule.kt` | Using `SharedPreferences` in new code, multiple DataStore instances, no corruption handler |
| [`offline-first`](skills/offline-first/SKILL.md) | Repository sync logic, `NetworkMonitor.kt`, `SyncWorker.kt` | UI showing network response directly, no optimistic updates, no retry logic, clearing cache on every refresh |

---

### Tier 4 — Platform Features

| Skill | File it helps with | What it fixes |
|---|---|---|
| [`firebase`](skills/firebase/SKILL.md) | `FirebaseModule.kt`, `AuthRepository.kt`, Firestore queries | No BoM, missing `.await()`, Firestore without offline persistence, missing security rules |
| [`permissions`](skills/permissions/SKILL.md) | Any screen requesting camera/location/mic/notifications | No rationale, permanently denied not handled, background location before foreground |
| [`notifications`](skills/notifications/SKILL.md) | `NotificationHelper.kt`, `MyFirebaseMessagingService.kt` | Channel not created, wrong `PendingIntent` flags, no `POST_NOTIFICATIONS` check on Android 13+ |
| [`camerax`](skills/camerax/SKILL.md) | Camera preview screen, QR scanner | Not unbinding before rebinding, `ImageProxy` not closed, wrong executor for `takePicture` |
| [`biometrics`](skills/biometrics/SKILL.md) | `MainActivity.kt` biometric setup | `BiometricPrompt` created in Composable, `DEVICE_CREDENTIAL` + `setNegativeButtonText` crash |

---

### Tier 5 — Quality & Security

| Skill | File it helps with | What it fixes |
|---|---|---|
| [`android-testing`](skills/android-testing/SKILL.md) | Every `*Test.kt` and `*ScreenTest.kt` file | No `MainDispatcherRule`, `runBlocking` in tests, mocking Repository instead of using Fake, no screenshot tests |
| [`performance`](skills/performance/SKILL.md) | `@Stable`/`@Immutable` annotations, baseline profiles | `List<T>` instead of `ImmutableList<T>`, inline computation in composition, no baseline profile |
| [`security`](skills/security/SKILL.md) | `SecureStorage.kt`, `network_security_config.xml`, `proguard-rules.pro` | API keys in `BuildConfig`, plain `SharedPreferences` for tokens, `android:allowBackup="true"` without rules |
| [`accessibility`](skills/accessibility/SKILL.md) | Semantics modifiers, touch targets, TalkBack | Missing `contentDescription`, touch targets < 48dp, no `mergeDescendants`, color as only differentiator |
| [`gradle`](skills/gradle/SKILL.md) | `build.gradle.kts`, `libs.versions.toml`, signing config | Versions hardcoded in build files, `kapt` everywhere, no `configuration-cache`, signing credentials committed |

---

### Tier 6 — Release

| Skill | File it helps with | What it fixes |
|---|---|---|
| [`ci-cd-android`](skills/ci-cd-android/SKILL.md) | `.github/workflows/ci.yml` | No Gradle cache, APK instead of AAB, credentials in code, no test automation |
| [`play-store-release`](skills/play-store-release/SKILL.md) | Release build config, Play Console | `isDebuggable = true` in release, forgot to increment `versionCode`, no Data Safety form |
| [`supabase-android`](skills/supabase-android/SKILL.md) | `SupabaseModule.kt`, any `supabase-kt` call | Missing `persistSession = false`, `decodeSingle()` on list query, non-`@Serializable` DTOs |

---

## Skill file structure — what's inside each skill

```
skills/<skill-name>/
├── SKILL.md           ← what the agent reads when triggered
│                         contains: rules, ✅ correct code, ❌ wrong code, anti-patterns
├── metadata.json      ← version, author, min/target SDK
├── rules/             ← individual rule source files (one per rule)
│   └── rule-name.md   ← impact level + full code example
└── references/        ← deep-dive files loaded only when needed
    └── topic.md       ← e.g., side-effects.md, hilt-testing.md, flow-patterns.md
```

Every `SKILL.md` is under 500 lines. References are loaded on demand — no context bloat.

---

## Contributing

Skills are plain Markdown. No build step. No toolchain. Just write and open a PR.

```bash
git clone https://github.com/piyushverma0/android-agent-skills
cd android-agent-skills

# Create a new skill
mkdir -p skills/your-skill-name/rules
mkdir -p skills/your-skill-name/references

# Write the skill following the format in AGENTS.md
# Every SKILL.md needs: YAML frontmatter with name + description,
# rules with ✅/❌ code pairs, and a "Common Mistakes" section

git checkout -b feat/your-skill-name
# ... write your skill ...
git commit -m "feat(your-skill-name): add skill"
git push
# Open PR
```

### Skills I need help building

These are the biggest gaps right now:

`room-paging` · `maps-compose` · `in-app-purchase` · `widgets-glance` · `media3-player` · `wear-os` · `compose-multiplatform` · `android-shortcuts` · `navigation-bar-customization` · `app-widgets` · `mlkit-text-recognition` · `bluetooth-le`

If you've debugged one of these and know what AI agents get wrong — please write the skill. That's exactly the knowledge this repo needs.

See [CONTRIBUTING.md](CONTRIBUTING.md) for format and quality checklist.

---

## Why this exists — the real reason

There are 88,000+ agent skills published globally. Zero dedicated to production Android/Kotlin.

I built this because I was building [FitGenZ](https://github.com/piyushverma0) — a Gen-Z fitness app — and Claude Code kept making the same mistakes. Every session. Edge-to-edge not handled. `collectAsState` instead of the lifecycle-aware version. Tablets looking completely different from the phone layout. No dark mode consistency.

I started writing the rules down. Then I packaged them as skills. Then I realized every Android developer using AI agents has this problem — and nobody had solved it.

So now it's a repo. If it helps you ship better Android apps, star it. If you find a rule that's wrong, open an issue. If you know a skill that should exist, write it.

That's it.

---

## Updating skills

```bash
npx android-agent-skills update

# Or manually:
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && cp -r /tmp/aas/skills/* ~/.claude/skills/ \
  && rm -rf /tmp/aas
```

---

## License

MIT — use it in personal projects, commercial projects, client projects. Do whatever you want with it.

---

*Built by [Piyush Verma](https://github.com/piyushverma0) — solo Android builder from Banda, UP.*  
*I build complete apps with AI agents. This is how I make them production-ready.*
