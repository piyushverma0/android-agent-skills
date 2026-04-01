# Android Agent Skills — Claude Code Installation

You are Claude Code. Follow these instructions to install android-agent-skills for this project.

## What you're installing

`android-agent-skills` is a collection of 5 Android/Kotlin skills (68 rules, 85 files) that teach you production-grade Android patterns. Once installed, you will automatically apply these rules when working on Android projects — no user prompt needed.

## Installation steps

1. **Determine the install location.**

   - If the user wants project-level skills (this project only): use `.claude/skills/`
   - If the user wants global skills (all projects): use `~/.claude/skills/`
   - Ask the user if you're not sure.

2. **Clone or download the skills.**

   Run the following command:

   ```bash
   npx skills add piyushverma0/android-agent-skills -a claude-code
   ```

   If `npx` is unavailable, manually clone:

   ```bash
   git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/android-agent-skills
   cp -r /tmp/android-agent-skills/skills/* .claude/skills/
   rm -rf /tmp/android-agent-skills
   ```

3. **Verify the install.**

   Confirm these skill directories exist:
   - `.claude/skills/compose-ui/SKILL.md`
   - `.claude/skills/supabase-android/SKILL.md`
   - `.claude/skills/kotlin-patterns/SKILL.md`
   - `.claude/skills/hilt-di/SKILL.md`
   - `.claude/skills/android-architecture/SKILL.md`

4. **Tell the user installation is complete.**

   Say: "Android Agent Skills installed. I'll now automatically apply compose-ui, supabase-android, kotlin-patterns, hilt-di, and android-architecture rules when you're building Android apps."

## What these skills do

| Skill | Rules | Triggers |
| --- | --- | --- |
| `compose-ui` | 24 | @Composable, LazyColumn, ModalBottomSheet, Scaffold, collectAsStateWithLifecycle, edge-to-edge |
| `supabase-android` | 11 | supabase-kt, persistSession, getUser(jwt), UnauthorizedRestException |
| `kotlin-patterns` | 12 | StateFlow, viewModelScope, sealed interface, coroutines, runCatching |
| `hilt-di` | 10 | @HiltViewModel, @Binds, @Provides, Dagger errors, KSP |
| `android-architecture` | 11 | ViewModel, Repository, UiState, UiEvent, MVVM, data layer |

## After installation

- You do NOT need to be told to use these skills. Read the relevant SKILL.md automatically when the user's task matches the trigger keywords.
- Load skills progressively: name + description always in context, full SKILL.md on trigger, references/ files on demand.
- If the user asks you to "use the compose-ui skill", load `.claude/skills/compose-ui/SKILL.md` immediately.

## Updating

```bash
npx skills update
```
