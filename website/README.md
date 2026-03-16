# ANDROID-SKILL Website (Next.js)

Production website for landing, docs, skills, and audit pages.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

Build runs static audit generation first:

```bash
python ../docs/website/scripts/generate_audit_data.py --output ../docs/website/audit-data/audit-report.json
```

## Vercel

- Framework: Next.js
- Root Directory: `website`
- Preview deployments: enabled for pull requests
- Production branch: `main`

## Analytics events

Client events are dispatched as browser `CustomEvent('analytics-event')`:

- `install_copy_click`
- `skill_page_visit`
- `audit_page_engagement`

Wire your analytics provider in `lib/track.ts` if needed.
