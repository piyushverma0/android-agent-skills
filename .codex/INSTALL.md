# Android Agent Skills — OpenAI Codex

You are OpenAI Codex. Read these instructions and follow them exactly.

## What you are installing

27 Android/Kotlin skills covering the full app lifecycle — Compose UI, adaptive layouts,
MVVM architecture, Hilt DI, Room, Retrofit, Firebase, testing, security, and Play Store release.

## Install steps

**1. Determine scope:**
- Global (all projects): `~/.codex/skills/`
- Project only: `.codex/skills/`
- Default to global.

**2. Run:**

```bash
# Global
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && mkdir -p ~/.codex/skills \
  && cp -r /tmp/aas/skills/* ~/.codex/skills/ \
  && rm -rf /tmp/aas \
  && echo "Installed $(ls ~/.codex/skills/ | wc -l) skills"

# Project
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && mkdir -p .codex/skills \
  && cp -r /tmp/aas/skills/* .codex/skills/ \
  && rm -rf /tmp/aas \
  && echo "Installed $(ls .codex/skills/ | wc -l) skills"
```

**3. Verify:** confirm `compose-ui/SKILL.md`, `adaptive-ui/SKILL.md`, `android-architecture/SKILL.md` exist.

**4. Confirm:** "Android Agent Skills installed — 27 skills covering the full Android lifecycle. Production patterns apply automatically."

## Skill trigger reference

| Skill | Auto-triggers when you mention... |
|---|---|
| `compose-ui` | @Composable, LazyColumn, Scaffold, ModalBottomSheet, collectAsStateWithLifecycle |
| `adaptive-ui` | tablet, WindowSizeClass, ListDetailPaneScaffold, foldable, large screen |
| `design-system` | spacing, typography, color roles, AppButton, design tokens, M3 Expressive |
| `android-architecture` | ViewModel, Repository, UseCase, UiState, MVVM, Clean Architecture |
| `hilt-di` | @HiltViewModel, @Binds, @Provides, @Module, Dagger error |
| `kotlin-patterns` | StateFlow, coroutines, sealed interface, runCatching, viewModelScope |
| `room-database` | @Entity, @Dao, Room, migration, TypeConverter |
| `retrofit` | Retrofit, OkHttp, API service, DTO, endpoint |
| `android-testing` | test, ViewModel test, Fake, MainDispatcherRule, runTest |
| `play-store-release` | release, AAB, Play Store, versionCode, targetSdk |

## Update

```bash
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && cp -r /tmp/aas/skills/* ~/.codex/skills/ \
  && rm -rf /tmp/aas
```
