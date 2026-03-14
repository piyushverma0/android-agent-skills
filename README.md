# android-agent-skills

> The open Android development skills repository for AI coding agents.
> Built by Android developers, for AI agents building Android apps.

```bash
npx skills add piyushverma0/android-agent-skills
```

---

## What Is This?

`android-agent-skills` is a collection of **Agent Skills** — reusable instruction sets that teach AI coding agents battle-tested Android/Kotlin patterns. Install once, and every agent you use (Claude Code, Codex, Cursor, Gemini CLI, and 35+ others) automatically follows production Android best practices without you repeating yourself every session.

**Without skills:** You explain `persistSession: false` every time you use Supabase. You remind the agent about `collectAsStateWithLifecycle`. You correct `!!` usage repeatedly.

**With skills:** The agent already knows. It reads the skill when relevant and applies the right pattern on the first try.

---

## How It Works — The Full Picture

### 1. Installation (one command, one time)

```bash
npx skills add piyushverma0/android-agent-skills
```

This installs all 5 skills into the correct location for your agent:

| Agent | Install path |
|---|---|
| Claude Code | `~/.claude/skills/` (global) or `.claude/skills/` (project) |
| Codex | `~/.codex/skills/` (global) or `.codex/skills/` (project) |
| Cursor | `~/.cursor/skills/` or `.cursor/skills/` |
| Gemini CLI | `~/.gemini/skills/` |
| OpenCode, Windsurf | auto-detected by CLI |

The `npx skills` CLI handles all path differences automatically.

### 2. How the Agent Reads Skills — Progressive Disclosure

Skills use a **3-level loading system**. Your agent doesn't dump everything into context at once — it loads only what's needed:

```
Level 1: name + description  ← always in context (~50 tokens per skill)
         Agent reads this at startup to know WHEN each skill is relevant.

Level 2: Full SKILL.md body  ← loaded when triggered (~2,000 tokens)
         Agent reads this when your prompt matches the skill's keywords.

Level 3: references/ files   ← loaded on demand (unlimited)
         Agent reads these only when the task needs deep detail.
         Example: animations.md loaded only when you're adding animations.
```

**No context penalty.** All 5 skills' names and descriptions cost ~250 tokens total. The full rules only load when actually needed.

### 3. Automatic Triggering — How the Agent Decides

The `description` field in each `SKILL.md` is the trigger mechanism. At startup, the agent scans all installed skills and keeps their name + description in its system prompt. When you give a task, the agent matches it against descriptions and loads the relevant skill automatically.

**Example trigger chain:**

```
You type:  "Fix the UnauthorizedRestException from my edge function"

Agent sees: supabase-android description contains "UnauthorizedRestException,
            persistSession, getUser(jwt), FunctionsHttpException"

Agent loads: skills/supabase-android/SKILL.md

Agent follows: Rule 1 — persistSession: false + getUser(jwt) pattern

Result: Agent writes the correct auth code on the first attempt
```

**You never have to say "use the skill" or manually invoke anything.** The description keywords do the matching automatically.

### 4. Manual Invocation (when you want explicit control)

```bash
# Claude Code — invoke a specific skill directly
/compose-ui

# Or reference it in your prompt
"Using the hilt-di skill, set up injection for my new feature"
```

---

## Available Skills

### `compose-ui` — 24 rules

Jetpack Compose UI best practices. Covers everything agents get wrong.

**Auto-triggers when you mention:** `@Composable`, `LazyColumn`, `remember`, `StateFlow`, `LaunchedEffect`, `ModalBottomSheet`, `Scaffold`, `AnimatedVisibility`, `collectAsStateWithLifecycle`, `recomposition`, edge-to-edge, IME keyboard, accessibility, Material 3, `WindowSizeClass`, Coil, camera permissions.

**Rules by impact:**

| Impact | Rules |
|---|---|
| CRITICAL | Edge-to-edge insets, IME keyboard, Scaffold innerPadding, BottomSheet nav bar, single UiState class, SharedFlow events, remember variants, no logic in composition, LaunchedEffect key, DisposableEffect, accessibility semantics, TextField security, loading/error/empty states, Material 3 theming |
| HIGH | LazyColumn stable keys, contentPadding, Modifier order, AnimatedVisibility specs, type-safe navigation, adaptive layouts, Coil image loading, runtime permissions |
| MEDIUM | Multi-preview annotations |

---

### `supabase-android` — 11 rules

Supabase Kotlin SDK patterns. Encodes the exact fixes for every common Supabase + Android bug.

**Auto-triggers when you mention:** `supabase-kt`, `UnauthorizedRestException`, `FunctionsHttpException`, `persistSession`, `getUser(jwt)`, `functions.invoke()`, `sessionStatus`, `config.toml`, `verify_jwt`, `@Serializable`, `decodeList`, `realtime`, storage.

**The #1 rule this skill teaches:**
```typescript
// The exact pattern that fixes UnauthorizedRestException
const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: `Bearer ${jwt}` } },
  auth:   { persistSession: false },   // ← without this, getUser() returns null
})
const { data } = await userClient.auth.getUser(jwt)  // ← pass jwt directly
```

---

### `kotlin-patterns` — 12 rules

Idiomatic Kotlin for Android production code.

**Auto-triggers when you mention:** `viewModelScope`, `lifecycleScope`, `Dispatchers`, `withContext`, `StateFlow`, `SharedFlow`, `stateIn`, `flatMapLatest`, `sealed interface`, `runCatching`, `!!` operator, `let`/`apply`/`also`, `lazy`, coroutine exceptions.

---

### `hilt-di` — 10 rules

Hilt dependency injection from setup to testing.

**Auto-triggers when you mention:** `@HiltViewModel`, `@AndroidEntryPoint`, `@HiltAndroidApp`, `@Module`, `@InstallIn`, `@Provides`, `@Binds`, `@Singleton`, `@ViewModelScoped`, `@EntryPoint`, `@AssistedInject`, `@HiltWorker`, `@HiltAndroidTest`, `@BindValue`, Dagger compile errors.

---

### `android-architecture` — 11 rules

MVVM + Unidirectional Data Flow patterns for Android.

**Auto-triggers when you mention:** `ViewModel`, `Repository`, `UseCase`, `UiState`, `UiEvent`, data layer, domain layer, presentation layer, `data class`, `sealed class`, package structure, navigation, multi-module, or any discussion of app architecture and separation of concerns.

---

## Install Options

### All skills, global (recommended — works across all your projects)
```bash
npx skills add piyushverma0/android-agent-skills -g
```

### All skills, current project only
```bash
npx skills add piyushverma0/android-agent-skills
```

### Specific skills only
```bash
npx skills add piyushverma0/android-agent-skills \
  --skill supabase-android \
  --skill compose-ui
```

### Target a specific agent
```bash
npx skills add piyushverma0/android-agent-skills -a claude-code
npx skills add piyushverma0/android-agent-skills -a codex
npx skills add piyushverma0/android-agent-skills -a cursor
npx skills add piyushverma0/android-agent-skills -a gemini
npx skills add piyushverma0/android-agent-skills --agent '*'  # all agents
```

### Team onboarding (non-interactive, CI-friendly)
```bash
npx skills add piyushverma0/android-agent-skills --all -a claude-code -y
```

### Check for updates
```bash
npx skills check
npx skills update
```

### Remove skills
```bash
npx skills remove compose-ui            # remove one
npx skills remove --all                 # remove all
```

---

## Supported Agents

| Agent | Supported | Notes |
|---|---|---|
| Claude Code | ✅ | Auto-loads from `~/.claude/skills/` or `.claude/skills/` |
| OpenAI Codex | ✅ | Reads from `~/.codex/skills/` |
| Cursor | ✅ | Reads from project-level or global skills folder |
| Gemini CLI | ✅ | Announced Agent Skills compatibility |
| Windsurf | ✅ | Auto-detected by CLI |
| OpenCode | ✅ | Auto-detected by CLI |
| GitHub Copilot | ✅ | Via skills CLI |
| Kiro | ⚠️ | Manual setup: add paths to `.kiro/agents/<agent>.json` |

---

## Real-World Examples

### Example 1: Supabase edge function (supabase-android triggers)

```
You:   "Write an edge function that verifies the user's JWT"

Without skill: Agent writes getUser() without jwt arg, missing persistSession: false
               → UnauthorizedRestException in production

With skill:    Agent writes the exact correct pattern on first attempt:
               - persistSession: false in createClient
               - getUser(jwt) with jwt passed directly
               - config.toml with verify_jwt = false
```

### Example 2: Compose screen (compose-ui triggers)

```
You:   "Create a screen with a list of questions and a bottom sheet result"

Without skill: Missing navigationBarsPadding(), innerPadding ignored,
               no stable keys in LazyColumn, hardcoded colors

With skill:    - Scaffold with innerPadding consumed on LazyColumn
               - ModalBottomSheet with navigationBarsPadding()
               - items() with key = { it.id }
               - MaterialTheme.colorScheme tokens (no hardcoded colors)
               - collectAsStateWithLifecycle (not collectAsState)
```

### Example 3: Hilt setup (hilt-di triggers)

```
You:   "Set up Hilt and inject my ScanRepository into the ViewModel"

Without skill: Uses kapt instead of KSP, @Provides instead of @Binds,
               missing @HiltAndroidApp, wrong scope annotation

With skill:    - KSP plugin (not kapt)
               - @Binds in abstract class for interface binding
               - @Singleton scope on repository
               - @HiltViewModel on ViewModel
               - hiltViewModel() in Composable
```

---

## File Structure

Each skill follows the same structure:

```
skills/<skill-name>/
├── SKILL.md          ← compiled main file (what the agent reads when triggered)
├── metadata.json     ← version, author, rule count
├── rules/            ← individual rule files (one per rule, source of truth)
│   ├── rule-name.md  ← Impact level + full examples + anti-patterns
│   └── ...
└── references/       ← deep-dive files loaded on demand
    ├── topic.md
    └── ...
```

### Rule file format

Each rule in `rules/` follows:
```markdown
# Rule Name

**Impact: CRITICAL | HIGH | MEDIUM | LOW**

Brief explanation of why this matters.

## Rule

✅ correct code example

❌ wrong code example with explanation

## Anti-Patterns (common mistakes)
```

---

## Total Coverage

| Skill | Rules | Files |
|---|---|---|
| `compose-ui` | 24 rules | 28 files |
| `supabase-android` | 11 rules | 15 files |
| `kotlin-patterns` | 12 rules | 15 files |
| `hilt-di` | 10 rules | 13 files |
| `android-architecture` | 11 rules | 14 files |
| **Total** | **68 rules** | **85 files** |

---

## Why This Exists

There are 88,000+ skills on skills.sh. Zero are dedicated to Android/Kotlin development.

These skills are built from real production debugging — not documentation summaries. Every rule encodes a mistake that actually happens in production:

- The `supabase-android` auth rule fixes a bug that takes 2–4 hours to debug the first time
- The `compose-ui` edge-to-edge rule prevents content being hidden on Android 15+
- The `hilt-di` common errors rule maps every cryptic Dagger error to its exact fix

---

## Contributing

Skills are plain Markdown. No build step, no toolchain required.

```bash
git clone https://github.com/piyushverma0/android-agent-skills
cd android-agent-skills

# Add a new skill
mkdir -p skills/<skill-name>/rules
# Create skills/<skill-name>/SKILL.md following AGENTS.md format
# Submit a PR
```

**Skills wanted:**
`room-database` · `camerax` · `android-testing` · `retrofit-android` · `workmanager` · `paging3` · `firebase-android` · `notifications-fcm` · `datastore` · `in-app-purchase` · `maps-compose`

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide and quality checklist.

---

## License

MIT — use freely in personal and commercial projects.

---

*Built by [piyushverma0](https://github.com/piyushverma0)*
