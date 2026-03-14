# ANDROID-SKILL Docs: Installation

## Quick install

```bash
npx skills add piyushverma0/android-agent-skills
```

## Install scopes

### Global install

```bash
npx skills add piyushverma0/android-agent-skills -g
```

### Current project only

```bash
npx skills add piyushverma0/android-agent-skills
```

### Install selected skills only

```bash
npx skills add piyushverma0/android-agent-skills \
  --skill supabase-android \
  --skill compose-ui
```

## Agent-targeted installs

```bash
npx skills add piyushverma0/android-agent-skills -a claude-code
npx skills add piyushverma0/android-agent-skills -a codex
npx skills add piyushverma0/android-agent-skills -a cursor
npx skills add piyushverma0/android-agent-skills -a gemini
npx skills add piyushverma0/android-agent-skills --agent '*'
```

## Maintenance commands

```bash
npx skills check
npx skills update
npx skills remove compose-ui
npx skills remove --all
```

## Troubleshooting install

- Ensure Node.js + `npx` are available.
- Re-run install with explicit `-a` agent target if auto-detection fails.
- Confirm local/global skill path permissions for your environment.
