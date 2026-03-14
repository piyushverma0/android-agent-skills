# ANDROID-SKILL Landing Page Blueprint

## Goal

Drive users to install the skill pack quickly while proving Android-specific depth.

## Hero (above the fold)

- Brand: **ANDROID-SKILL**
- Value proposition: “Production-ready Android development skills for AI coding agents.”
- Primary CTA: copyable command button

```bash
npx skills add piyushverma0/android-agent-skills
```

- Secondary links:
  - `Explore docs` → `/docs`
  - `View audit` → `/audit`

- Proof chips (repo-backed):
  - `5 Skills`
  - `68 Rules`
  - `Progressive disclosure loading (3 levels)`

## Section order (must match implementation)

## 1) How it works

Three-step visual process:
1. Install once with `npx skills add`.
2. Agent reads name/description triggers.
3. Agent progressively loads rules/references only when needed.

Include short trigger-chain example with `UnauthorizedRestException` and `@HiltViewModel`.

## 2) Featured skills

Feature all five skill families with direct links:
- Compose UI
- Supabase Android
- Kotlin Patterns
- Hilt DI
- Android Architecture

Card fields:
- short description
- top trigger keywords
- rule count
- impact distribution preview
- `/skills/[slug]` deep link

## 3) Why Android-specific

Narrative points:
- Focused on Android standards (MVVM + UDF, Hilt-only, Coroutines/Flow, Coil).
- Captures real production bugs (e.g., Supabase JWT edge function auth pattern).
- Avoids generic, web-first agent patterns.

## 4) Supported agents

Matrix section with known compatible agents and notes.
Include status chips for supported / partial.

## 5) Quick start

- Global install
- Project install
- Specific skill install
- Update/remove commands
- Links to `/docs/cli`.

## Social proof + integration points

Placeholders:
- community logos strip
- testimonial carousel stubs
- “Built in public” note

GitHub stats module (integration point):
- stars
- forks
- last commit
- “View on GitHub” button

## Internal link strategy

- Top nav: `/docs`, `/audit`, `/skills`
- Hero actions: `/docs`, `/audit`
- Featured cards: `/skills/[slug]`
- Footer: `/docs`, `/docs/cli`, `/docs/faq`, `/audit`

## SEO metadata draft

- Title: `ANDROID-SKILL — Android Agent Skills for AI Coding Assistants`
- Description: `Install Android-focused agent skills with one command. Compose, Hilt, Kotlin, architecture, and Supabase patterns with progressive disclosure.`
- OG image: dark-theme hero preview with command block.
