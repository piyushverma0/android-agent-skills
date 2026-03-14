# ANDROID-SKILL Docs: Agent Compatibility

## Supported agents matrix

| Agent | Supported | Notes |
|---|---|---|
| Claude Code | ✅ | Auto-load from global/project skills path |
| OpenAI Codex | ✅ | Reads from Codex skills location |
| Cursor | ✅ | Supports global and project setups |
| Gemini CLI | ✅ | Compatible with skills workflow |
| Windsurf | ✅ | Auto-detected by CLI |
| OpenCode | ✅ | Auto-detected by CLI |
| GitHub Copilot | ✅ | Works via skills CLI integration |
| Kiro | ⚠️ | Manual path configuration required |

## Compatibility guidance

- Prefer global install for team consistency.
- Use project-level install when repositories need isolated skill versions.
- Add troubleshooting links to `/docs/faq` and `/docs/installation`.
