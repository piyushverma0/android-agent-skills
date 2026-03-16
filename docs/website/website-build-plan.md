# ANDROID-SKILL Website Build Plan (Step-by-step)

## Step 1 — Foundations (completed in docs)

- Information architecture and schema: `docs/website-information-architecture.md`
- Design tokens and component guide: `docs/website/design-tokens-and-component-style-guide.md`
- Landing blueprint and section order: `docs/website/landing-page-blueprint.md`
- Generated skills data model: `docs/website/skills-data/skills-index.json`
- Skill detail data: `docs/website/skills-data/<slug>.json`
- Skills pages implementation + ISR strategy: `docs/website/skills-pages-implementation-spec.md`

## Step 2 — Docs platform content (completed in docs)

- README mapping to docs routes: `docs/website/docs-site-map-and-content-mapping.md`
- Overview: `docs/website/docs-pages/overview.md`
- Installation: `docs/website/docs-pages/installation.md`
- Triggering behavior: `docs/website/docs-pages/triggering-behavior.md`
- Progressive disclosure: `docs/website/docs-pages/progressive-disclosure.md`
- Agent compatibility: `docs/website/docs-pages/agent-compatibility.md`
- FAQ: `docs/website/docs-pages/faq.md`
- CLI reference: `docs/website/docs-pages/cli-reference.md`
- “Use with ANDROID-SKILL” examples: `docs/website/docs-pages/use-with-android-skill-examples.md`
- Contributing page: `docs/website/docs-pages/contributing.md`

## Step 3 — Audit implementation (completed in docs/scripts)

- Audit generation script: `docs/website/scripts/generate_audit_data.py`
- Audit scoring + rendering spec: `docs/website/audit-generation-and-rendering.md`

## Step 4 — Next.js + Vercel implementation contract (completed in docs)

- App Router, typed content layer, SSG/ISR, sitemap/robots/OG, env strategy:
  `docs/website/nextjs-vercel-implementation.md`

## Step 5 — Analytics, SEO, and launch readiness (completed in docs)

- Event taxonomy, canonical/structured data guidance, launch checklist, post-launch loop:
  `docs/website/analytics-seo-launch-plan.md`

## Step 6 — Execution order for coding phase

1. Scaffold Next.js App Router routes and layout.
2. Implement typed readers for docs/skills/audit JSON + markdown.
3. Build `/`, `/skills`, `/skills/[slug]`, `/docs/*`, `/audit` pages.
4. Add metadata, sitemap, robots, OG generation.
5. Add analytics events and verify tracking.
6. Run perf/a11y/link/mobile validation and launch to Vercel.
