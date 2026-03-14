# `/skills` and `/skills/[slug]` Implementation Spec (Vercel)

This spec uses generated data from `docs/website/skills-data/` and supports static generation + incremental updates.

## Data sources

- Index: `docs/website/skills-data/skills-index.json`
- Detail pages: `docs/website/skills-data/<slug>.json`
- Canonical source: `skills/*/SKILL.md`, `skills/*/metadata.json`, `skills/*/rules/*.md`, `skills/*/references/*.md`

## `/skills` page requirements

## Listing behavior

- Render all 5 skills from `skills-index.json`.
- Show card fields:
  - skill name + slug
  - short description
  - trigger keywords
  - impact coverage mini chart
  - rule count (`rules/` directory count as canonical display)
  - topic/category chips

## Filtering

Must support combinable filters:

1. **Impact coverage**
   - options: CRITICAL, HIGH, MEDIUM, LOW
   - behavior: include skill when selected impact count > 0.
2. **Topic**
   - options from `topic` array (metadata categories).
3. **Trigger keywords**
   - tokenized keyword search from frontmatter-derived triggers.

Additional controls:
- text search across `name + description + tags + triggers`
- reset filters button
- URL-state query params for shareable filter URLs

## `/skills/[slug]` page requirements

For each slug (SSG path):

- Header with name, description, install snippet.
- Trigger chip rail.
- Rule groups by impact (CRITICAL/HIGH/MEDIUM/LOW/UNSPECIFIED).
- “Common mistakes” highlights pulled from heading markers in SKILL content.
- References panel listing `references/*.md` links.
- Link cluster: `/docs`, `/audit`, `/skills`.

## Install snippet

```bash
npx skills add piyushverma0/android-agent-skills --skill <slug>
```

## Static generation and incremental updates

### Next.js App Router recommendation

- `/skills` generated at build from `skills-index.json`.
- `/skills/[slug]` with `generateStaticParams()` from skill slugs.
- Use ISR:

```ts
export const revalidate = 3600
```

- If webhooks available from GitHub/Vercel, call `revalidateTag('skills-data')` on content changes.

### Caching strategy

- Cache parsed JSON in server runtime memory for request bursts.
- Keep payload small by lazy-loading rule examples on details only.

### Build-time content refresh step

Before deploy, regenerate data files from repo markdown/json and commit results:
- `docs/website/skills-data/skills-index.json`
- `docs/website/skills-data/*.json`

## Performance guardrails

- Keep `/skills` JS minimal; prefer server components and static HTML.
- Only hydrate filter UI controls.
- Defer heavy charts; use lightweight progress bars for impact coverage.
- Optimize for Core Web Vitals on Vercel edge cache.

## Accessibility guardrails for listing + detail pages

- Filter controls with explicit labels and keyboard navigation.
- Active filter chips exposed with `aria-pressed`.
- Cards use heading hierarchy (`h2` list, `h1` page title).
- Reference links have descriptive titles.
