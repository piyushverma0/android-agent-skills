# Production Implementation Status

A deployable Next.js App Router website has been scaffolded under `website/`.

## Implemented

- Landing page (`/`)
- Skills listing (`/skills`) with client-side filtering
- Skill detail pages (`/skills/[slug]`) with static params + ISR
- Docs index and dynamic docs routes (`/docs`, `/docs/[...slug]`)
- Audit dashboard (`/audit`) using generated static audit JSON
- Metadata, canonical handling, Open Graph image generation, sitemap, and robots
- Vercel project config (`website/vercel.json`)

## Build prerequisites

- Node.js and npm access to install dependencies from npm registry
- Python for audit generation script

## Deploy steps

1. Set Vercel project root to `website`.
2. Ensure install/build commands are from `website/vercel.json`.
3. Push to trigger preview deployment, merge to `main` for production.
