# ANDROID-SKILL Docs: Troubleshooting / FAQ

## Why is my skill not triggering?

- Confirm your prompt includes relevant trigger keywords.
- Use exact technical terms where possible (e.g., `@HiltViewModel`, `StateFlow`, `UnauthorizedRestException`).
- Verify installation succeeded for the target agent.

## Should I manually invoke a skill?

Usually no. Auto-triggering is preferred. Manually invoke only when:
- prompts are broad,
- multiple domains overlap,
- you need deterministic behavior.

## Why does the agent ask fewer follow-ups now?

Because skills encode best-practice defaults and edge-case handling that would normally require clarification.

## How do I validate install health?

```bash
npx skills check
```

## How do I update?

```bash
npx skills update
```

## How do I remove one or all skills?

```bash
npx skills remove compose-ui
npx skills remove --all
```

## Where can I see repository quality status?

Visit `/audit` for completeness, compliance, freshness, and docs coverage scoring.
