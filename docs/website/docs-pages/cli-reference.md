# ANDROID-SKILL Docs: CLI Command Reference

All snippets are copy-ready.

## Install

```bash
npx skills add piyushverma0/android-agent-skills
```

## Install globally

```bash
npx skills add piyushverma0/android-agent-skills -g
```

## Install specific skills

```bash
npx skills add piyushverma0/android-agent-skills --skill compose-ui --skill hilt-di
```

## Target specific agent

```bash
npx skills add piyushverma0/android-agent-skills -a codex
```

## Team onboarding / non-interactive

```bash
npx skills add piyushverma0/android-agent-skills --all -a claude-code -y
```

## Check, update, remove

```bash
npx skills check
npx skills update
npx skills remove compose-ui
npx skills remove --all
```
