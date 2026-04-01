# Android Agent Skills — Codex Installation

You are OpenAI Codex. Follow these instructions to install android-agent-skills.

## What you're installing

`android-agent-skills` is a collection of 5 Android/Kotlin skills (68 rules, 85 files) that encode production-grade Android patterns into your context. Once installed, you will automatically apply these rules when working on Android projects.

## Installation steps

1. **Determine the install location.**

   - Project-level (this project only): `.codex/skills/`
   - Global (all projects): `~/.codex/skills/`
   - Default to project-level unless the user says otherwise.

2. **Install the skills.**

   Run:

   ```bash
   npx skills add piyushverma0/android-agent-skills -a codex
   ```

   If `npx` is unavailable, clone manually:

   ```bash
   git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/android-agent-skills
   mkdir -p .codex/skills
   cp -r /tmp/android-agent-skills/skills/* .codex/skills/
   rm -rf /tmp/android-agent-skills
   ```

3. **Verify the install.**

   Confirm these files exist:
   - `.codex/skills/compose-ui/SKILL.md`
   - `.codex/skills/supabase-android/SKILL.md`
   - `.codex/skills/kotlin-patterns/SKILL.md`
   - `.codex/skills/hilt-di/SKILL.md`
   - `.codex/skills/android-architecture/SKILL.md`

4. **Confirm to the user.**

   Say: "Android Agent Skills installed (5 skills, 68 rules). I'll automatically apply these when you work on Android/Kotlin code."

## Skill trigger reference

| Skill | Triggers automatically when you mention... |
| --- | --- |
| `compose-ui` | @Composable, LazyColumn, Scaffold, ModalBottomSheet, AnimatedVisibility, edge-to-edge, IME, Material 3, Coil |
| `supabase-android` | supabase-kt, persistSession, getUser(jwt), UnauthorizedRestException, FunctionsHttpException |
| `kotlin-patterns` | StateFlow, SharedFlow, viewModelScope, sealed interface, coroutines, runCatching, !! operator |
| `hilt-di` | @HiltViewModel, @Binds, @Provides, @Singleton, @AndroidEntryPoint, Dagger compile error |
| `android-architecture` | ViewModel, Repository, UseCase, UiState, UiEvent, MVVM, data layer, domain layer |

## Behaviour after installation

- Read each SKILL.md automatically when task keywords match — do not wait to be told.
- Do not front-load all 85 files. Load progressively: description at startup, full SKILL.md on trigger, references/ on demand.
- If the user asks "use supabase-android skill", read `.codex/skills/supabase-android/SKILL.md` immediately.

## Updating

```bash
npx skills update
```
