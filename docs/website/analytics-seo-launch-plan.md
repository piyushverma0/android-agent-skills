# Analytics, SEO, and Launch Plan

## Analytics event taxonomy

Track these events across landing/docs/skills/audit:

1. `install_copy_click`
   - props: `location`, `command_variant`
2. `docs_nav_depth`
   - props: `depth`, `path`, `session_id`
3. `skill_page_view`
   - props: `slug`, `source_route`
4. `audit_page_engagement`
   - props: `time_on_page_s`, `filter_count`, `expanded_skill_count`

## Technical SEO requirements

- Canonical URLs for all routes.
- JSON-LD structured data:
  - Organization / Project on landing
  - TechArticle for docs pages
  - Dataset/CollectionPage for `/skills`
- Per-skill metadata:
  - title: `<skill> | ANDROID-SKILL`
  - description derived from skill frontmatter
  - OG/Twitter cards with skill badge + rule count

## Launch checklist

## Performance budgets

- LCP <= 2.5s
- CLS <= 0.1
- INP <= 200ms

## Accessibility checks

- keyboard navigation on all primary interactions
- color contrast validation (AA)
- aria labels for copy, filters, nav controls

## Content + quality checks

- broken link scan for all docs routes
- command snippet validation (`npx skills` commands)
- mobile responsive checks (small, medium, large breakpoints)

## Observability checks

- ensure analytics events fire once per interaction
- verify event props are not missing required fields

## Post-launch iteration loop

Weekly cycle:

1. Review top-exit pages and route drop-off.
2. Review failed searches/filter combinations in `/skills`.
3. Compare install-copy clicks vs docs dwell time.
4. Prioritize improvements in docs clarity and conversion UI.
5. Ship one focused iteration per week and track delta.
