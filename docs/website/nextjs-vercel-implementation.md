# Next.js App Router + Vercel Implementation Guide

This document defines the production implementation approach.

## App Router structure

```text
app/
  page.tsx                     # landing
  skills/page.tsx              # list page (SSG)
  skills/[slug]/page.tsx       # details (SSG + ISR)
  docs/page.tsx                # docs overview
  docs/[...slug]/page.tsx      # docs content pages
  audit/page.tsx               # audit dashboard (SSG + ISR)
  sitemap.ts
  robots.ts
  opengraph-image.tsx
  layout.tsx
lib/
  content/
    types.ts                   # typed content layer interfaces
    read-skills.ts             # markdown/json parser
    read-docs.ts               # docs content loader
    read-audit.ts              # audit payload loader
```

## Typed content layer

Use shared interfaces for skill, rule, docs page, and audit result.
All readers parse local repository files at build time.

## Static generation strategy

- `/`, `/docs`, `/skills`: static generation.
- `/skills/[slug]`: `generateStaticParams()` for all skills.
- `/audit`: static + ISR.

Example ISR setting:

```ts
export const revalidate = 3600
```

## Metadata, Open Graph, sitemap, robots

### Metadata

- Global metadata in `app/layout.tsx`
- Per-page metadata via `generateMetadata`
- Skill detail metadata includes skill name, description, and canonical URL

### Sitemap

- Include: `/`, `/skills`, `/skills/<slug>`, `/docs`, docs child pages, `/audit`
- Regenerate during build to reflect skill/doc additions

### Robots

- Allow indexing for production
- Disallow non-public preview paths if any are introduced

### Open Graph

- Generate OG card with ANDROID-SKILL branding and install command

## Vercel deployment strategy

- PRs: preview deployments enabled by default
- `main`: production deployment
- Build command should include static data generation before `next build`

Example build step sequence:

```bash
python docs/website/scripts/generate_audit_data.py --output docs/website/audit-data/audit-report.json
# plus skill data generation script if used
next build
```

## Environment variables

Only introduce env vars if external APIs are added (analytics backends, GitHub API with auth, remote audit ingest).

Current recommendation:
- keep static/local-only mode without required env vars
- document optional vars in `.env.example` when needed
