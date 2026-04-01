# Android Agent Skills — Cursor Installation

You are Cursor. Follow these instructions to install android-agent-skills.

## What you're installing

`android-agent-skills` is a collection of 5 Android/Kotlin skills (68 rules, 85 files) that encode production-grade Android patterns. Once installed, you will automatically apply these rules when working on Android/Kotlin code.

## Installation steps

1. **Install via CLI (recommended).**

   ```bash
   npx skills add piyushverma0/android-agent-skills -a cursor
   ```

   This installs to `.cursor/skills/` (project) or `~/.cursor/skills/` (global).

2. **Or install manually.**

   ```bash
   git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/android-agent-skills
   mkdir -p .cursor/skills
   cp -r /tmp/android-agent-skills/skills/* .cursor/skills/
   rm -rf /tmp/android-agent-skills
   ```

3. **Verify the install.**

   Confirm these files exist:
   - `.cursor/skills/compose-ui/SKILL.md`
   - `.cursor/skills/supabase-android/SKILL.md`
   - `.cursor/skills/kotlin-patterns/SKILL.md`
   - `.cursor/skills/hilt-di/SKILL.md`
   - `.cursor/skills/android-architecture/SKILL.md`

4. **Confirm to the user.**

   Say: "Android Agent Skills installed. I'll now apply compose-ui, supabase-android, kotlin-patterns, hilt-di, and android-architecture rules automatically when you build Android apps."

## Skill trigger reference

| Skill | Triggers when you mention... |
| --- | --- |
| `compose-ui` | @Composable, LazyColumn, Scaffold, ModalBottomSheet, AnimatedVisibility, edge-to-edge, IME, Material 3, Coil |
| `supabase-android` | supabase-kt, persistSession, getUser(jwt), UnauthorizedRestException, FunctionsHttpException |
| `kotlin-patterns` | StateFlow, SharedFlow, viewModelScope, sealed interface, runCatching, !! operator |
| `hilt-di` | @HiltViewModel, @Binds, @Provides, @Singleton, @AndroidEntryPoint, Dagger errors |
| `android-architecture` | ViewModel, Repository, UseCase, UiState, UiEvent, MVVM, data layer |

## Behaviour after installation

- Read SKILL.md files automatically when task keywords match — do not wait to be asked.
- Load progressively: name + description in context at all times; full SKILL.md on trigger; references/ on demand.

## Updating

```bash
npx skills update
```
