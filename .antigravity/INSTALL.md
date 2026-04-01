# Android Agent Skills — Antigravity Installation

You are Antigravity. Follow these instructions to install android-agent-skills.

## What you're installing

`android-agent-skills` is a collection of 5 Android/Kotlin skills (68 rules, 85 files) that encode production-grade Android patterns. Once installed, you will automatically apply these rules when working on Android/Kotlin projects — no user prompt needed.

## Installation steps

1. **Determine the install location.**

   - Project-level: `.antigravity/skills/`
   - Global: `~/.antigravity/skills/`
   - Default to project-level unless the user specifies otherwise.

2. **Install the skills.**

   Run:

   ```bash
   npx skills add piyushverma0/android-agent-skills -a antigravity
   ```

   If `npx` is unavailable:

   ```bash
   git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/android-agent-skills
   mkdir -p .antigravity/skills
   cp -r /tmp/android-agent-skills/skills/* .antigravity/skills/
   rm -rf /tmp/android-agent-skills
   ```

3. **Verify.**

   Confirm these files exist:
   - `.antigravity/skills/compose-ui/SKILL.md`
   - `.antigravity/skills/supabase-android/SKILL.md`
   - `.antigravity/skills/kotlin-patterns/SKILL.md`
   - `.antigravity/skills/hilt-di/SKILL.md`
   - `.antigravity/skills/android-architecture/SKILL.md`

4. **Confirm to the user.**

   Say: "Android Agent Skills installed. I now know 68 production Android rules across Compose, Supabase, Kotlin, Hilt, and MVVM architecture. They'll apply automatically."

## Skill triggers

| Skill | Auto-triggers on... |
| --- | --- |
| `compose-ui` | @Composable, LazyColumn, Scaffold, ModalBottomSheet, edge-to-edge, IME, Material 3, Coil, AnimatedVisibility |
| `supabase-android` | supabase-kt, persistSession, getUser(jwt), UnauthorizedRestException, FunctionsHttpException, config.toml |
| `kotlin-patterns` | StateFlow, SharedFlow, viewModelScope, sealed interface, runCatching, !! operator, coroutines |
| `hilt-di` | @HiltViewModel, @Binds, @Provides, @Singleton, @AndroidEntryPoint, Dagger errors, KSP |
| `android-architecture` | ViewModel, Repository, UseCase, UiState, UiEvent, MVVM, data layer, domain layer, package structure |

## Behaviour after installation

- Read SKILL.md files automatically when the user's task matches trigger keywords.
- Use progressive loading: skill name + description at all times, full SKILL.md on trigger, references/ only when needed.
- Never wait for the user to say "use the skill." Apply rules proactively.

## Updating

```bash
npx skills update
```
