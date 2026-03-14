# Contributing to android-agent-skills

Thanks for contributing to **android-agent-skills**. This repository contains Android-focused skills for AI coding agents, where each skill is primarily authored as Markdown instructions.

## Contribution Workflow

1. **Plan one focused change per PR**
   - Prefer a single skill addition/update or one documentation change per pull request.
   - Keep scope narrow so reviewers can validate quality quickly.

2. **Create or update files in the expected location**
   - Existing skills live in `skills/<skill-name>/`.
   - New skills must follow the required structure described below.

3. **Follow repository standards while authoring**
   - Keep examples practical and compile-ready for Kotlin/Android contexts.
   - Use modern Android guidance (MVVM + UDF, Hilt, Coroutines/Flow, Coil).
   - Avoid deprecated Android patterns and unsupported alternatives.

4. **Self-review before opening a PR**
   - Validate frontmatter, section completeness, links, and consistency.
   - Confirm there are no generated or unrelated files in your diff.

5. **Open a PR with a conventional commit-style title**
   - Use the commit conventions below for both commit messages and PR title style when possible.

## Expected Structure for New Skills

When adding a new skill, create this structure under `skills/<new-skill>/`:

```text
skills/<new-skill>/
├── SKILL.md
├── metadata.json
├── rules/
│   ├── <rule-1>.md
│   └── <rule-2>.md
└── references/
    ├── <deep-dive-1>.md
    └── <deep-dive-2>.md
```

### Required files and directories

- **`SKILL.md`**
  - Must include YAML frontmatter with `name` and `description`.
  - Keep it concise and actionable; this is the primary entry point agents read.
  - Include a **Common Mistakes** section.

- **`metadata.json`**
  - Provide machine-readable metadata used by skill tooling/discovery.

- **`rules/`**
  - Store focused rule files for implementation patterns and pitfalls.
  - Prefer small, topic-specific files over one long rule document.

- **`references/`**
  - Store deeper optional material that supports `SKILL.md`.
  - Link these files from `SKILL.md` and indicate when to read them.

## Quality Checklist

Before submitting, verify all applicable items:

- [ ] Skill scope is clear and tightly focused.
- [ ] `SKILL.md` includes valid YAML frontmatter (`name`, `description`).
- [ ] Description includes concrete trigger keywords and is concise.
- [ ] `SKILL.md` includes a **Common Mistakes** section.
- [ ] Code examples are realistic and compile-ready (no critical pseudocode).
- [ ] Common mistakes are shown as ❌ wrong way and ✅ correct way.
- [ ] Guidance aligns with repo standards:
  - [ ] Min SDK API 24+
  - [ ] MVVM + UDF
  - [ ] Hilt DI
  - [ ] Coroutines + Flow
  - [ ] Coil for images
- [ ] No deprecated patterns suggested (e.g., AsyncTask, LiveData-first guidance, RxJava-first guidance, Java-style Android patterns).
- [ ] `SKILL.md` stays under 500 lines; overflow moved into `references/`.
- [ ] `references/` files are linked from `SKILL.md` with usage guidance.
- [ ] No generated files or unrelated changes included.

## Commit Conventions

Use the repository commit format:

- `feat(skill-name): description`
- `fix(skill-name): description`
- `docs(readme): description`

Additional expectations:

- Keep each PR focused on one skill or one docs change.
- Do **not** commit `node_modules`, `.DS_Store`, or generated files.
- Do **not** rename existing skill `name` fields in `SKILL.md` frontmatter.

## Pull Request Tips

- Explain what changed and why.
- List any files reviewers should prioritize.
- Include follow-ups separately rather than expanding scope mid-review.

Thanks for helping keep android-agent-skills consistent, practical, and easy for agents to use.
