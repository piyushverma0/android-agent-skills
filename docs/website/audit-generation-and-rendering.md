# `/audit` Static Generation and Rendering Spec

## Objective

Render an audit dashboard with:

- skill completeness (frontmatter, common mistakes, rule/reference counts)
- standards compliance (Hilt-only, Flow over LiveData, no deprecated patterns)
- freshness (last update timestamps)
- documentation coverage
- pass/warn/fail badges per skill + global score

## Build-time static generation

Use the script:

```bash
python docs/website/scripts/generate_audit_data.py \
  --output docs/website/audit-data/audit-report.json
```

The script scans:

- `skills/*/SKILL.md`
- `skills/*/metadata.json`
- `skills/*/rules/*.md`
- `skills/*/references/*.md`

## Output contract

`audit-report.json` includes:

- `globalScore` (0–100)
- `globalBadge` (`pass|warn|fail`)
- per-skill records with grouped check results
- per-skill `score` and `badge`

## Badge thresholds

- `pass`: score >= 85
- `warn`: score >= 60 and < 85
- `fail`: score < 60

## UI rendering requirements

## Global summary cards

- Global score
- Count of pass/warn/fail skills
- High-priority warnings list

## Per-skill table

Columns:

1. Skill
2. Badge
3. Score
4. Completeness
5. Compliance
6. Freshness
7. Docs coverage

Status presentation:

- ✅ pass
- ⚠️ warn
- ❌ fail

## Drill-down panel

For selected skill, show each check message from audit payload.

## Accessibility

- table headers with proper scope
- icons with text labels (no color-only signaling)
- keyboard navigation for row selection/filtering

## ISR strategy

- Generate `audit-report.json` at build time.
- In App Router, set `revalidate = 3600` for `/audit`.
- Optional webhook triggers for faster invalidation if needed.
