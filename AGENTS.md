# android-agent-skills — Codex Instructions

## What This Repo Is

Open-source Android development skills for AI coding agents.
Each skill is a SKILL.md file — plain Markdown, no build step.
Install command: npx skills add piyushverma0/android-agent-skills

## Repo Structure

android-agent-skills/
├── AGENTS.md                    ← Codex reads this first (you are here)
├── README.md                    ← User-facing docs
├── CONTRIBUTING.md
├── skills/
│   ├── compose-ui/
│   │   ├── SKILL.md             ← required, YAML frontmatter mandatory
│   │   └── references/          ← deep-dive files linked from SKILL.md
│   ├── supabase-android/
│   ├── kotlin-patterns/
│   ├── hilt-di/
│   ├── android-architecture/
│   └── <new-skill>/             ← all new skills follow this structure
└── .github/

## SKILL.md Format — Never Deviate

Every SKILL.md MUST start with exactly:

---
name: kebab-case-name
description: |
  What this skill covers AND specific trigger keywords.
  Include exact terms: @HiltViewModel, StateFlow, UnauthorizedRestException.
  Under 60 words. This is the only thing the agent reads to decide to load the skill.
---

## Writing Rules

1. Every code example must compile — no pseudocode in critical paths
2. Show ❌ wrong way then ✅ correct way for common mistakes
3. Every skill needs a "Common Mistakes" section
4. Kotlin style: val over var, trailing lambdas, named args for 3+ params, no !! operator
5. SKILL.md under 500 lines — overflow goes in references/ subfolder
6. Reference files must be linked from SKILL.md with guidance on when to read them

## Android Standards This Repo Follows

- Min SDK: API 24 (Android 7.0) unless stated otherwise
- Architecture: MVVM + Unidirectional Data Flow
- DI: Hilt only (not Koin, not bare Dagger)
- Async: Coroutines + Flow (not RxJava, not LiveData)
- Images: Coil
- NEVER suggest: deprecated APIs, AsyncTask, Java-style Android, LiveData

## Commit Format

feat(skill-name): description
fix(skill-name): description
docs(readme): description

One skill per PR. Never commit node_modules, .DS_Store, or generated files.

## Do NOT

- Do not add package.json, build systems, or any tooling
- Do not add CI that validates Markdown
- Do not hardcode library version numbers in prose (only in code blocks)
- Do not change the `name` field of existing skills — breaks installs
