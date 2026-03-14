# ANDROID-SKILL Docs: Triggering Behavior

Skills auto-load based on the `description` in each `SKILL.md` frontmatter.

## How matching works

1. Agent keeps skill names + descriptions in startup context.
2. User prompt terms are matched against trigger keywords.
3. Matched skill is loaded and rules are applied.

## Trigger examples

- Mention `UnauthorizedRestException` or `persistSession` → load `supabase-android`.
- Mention `@HiltViewModel` or `@AndroidEntryPoint` → load `hilt-di`.
- Mention `LazyColumn`, `LaunchedEffect`, `collectAsStateWithLifecycle` → load `compose-ui`.
- Mention architecture terms like `ViewModel`, `Repository`, `UiState` → load `android-architecture`.

## Manual invocation

Use direct references in prompts for explicit control:

- “Using the `hilt-di` skill, wire this feature module.”
- “Apply `compose-ui` rules for this screen.”
