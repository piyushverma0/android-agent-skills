# Android Agent Skills — Claude Code

You are Claude Code. Read these instructions fully and follow them.

## What you are installing

27 Android/Kotlin skills, 180+ production rules covering the full app lifecycle:
project setup → Compose UI → architecture → data layer → platform features → testing → Play Store.

Once installed, you will automatically apply the right patterns without being asked.

## Install steps

**1. Ask the user which scope they want:**
- Global (recommended — all projects): `~/.claude/skills/`
- Project only (this project): `.claude/skills/`
- Default to global if they don't specify.

**2. Run the install:**

```bash
# Global install
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && mkdir -p ~/.claude/skills \
  && cp -r /tmp/aas/skills/* ~/.claude/skills/ \
  && rm -rf /tmp/aas \
  && echo "✅ Installed $(ls ~/.claude/skills/ | wc -l) skills globally"

# Project install
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && mkdir -p .claude/skills \
  && cp -r /tmp/aas/skills/* .claude/skills/ \
  && rm -rf /tmp/aas \
  && echo "✅ Installed $(ls .claude/skills/ | wc -l) skills for this project"
```

**3. Verify these exist:**
- `compose-ui/SKILL.md` — Compose rules (24 rules)
- `adaptive-ui/SKILL.md` — responsive layouts
- `design-system/SKILL.md` — M3 Expressive tokens
- `android-architecture/SKILL.md` — MVVM + Clean
- `android-testing/SKILL.md` — testing patterns

**4. Tell the user:**

"✅ Android Agent Skills installed — 27 skills ready. I'll now automatically write production-quality Jetpack Compose code, adaptive layouts that work on tablets and foldables, consistent M3 Expressive design, Hilt DI, Room, Retrofit, tests, and guide you through Play Store release. No extra prompting needed."

## How I use these skills

- I read SKILL.md files automatically when your task matches trigger keywords in their description
- I never wait to be told to use a skill — keywords trigger loading automatically
- Progressive loading: ~50 tokens per skill at startup, full rules only when triggered
- All 27 skills at startup cost ~1,350 tokens total — no performance impact

## Manual invocation

```
/compose-ui           # load Compose rules now
/adaptive-ui          # load adaptive layout rules now
/android-testing      # load testing rules now

# Or in a prompt:
"Using the design-system skill, build a consistent button component"
```

## Update skills

```bash
git clone --depth=1 https://github.com/piyushverma0/android-agent-skills.git /tmp/aas \
  && cp -r /tmp/aas/skills/* ~/.claude/skills/ \
  && rm -rf /tmp/aas \
  && echo "✅ Updated"
```
