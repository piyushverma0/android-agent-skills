# Website Information Architecture Draft

## 1) Sitemap

| Route | Page purpose | Primary data sources |
|---|---|---|
| `/` | Landing page with value proposition, install CTA, social proof, and quick examples. | `README.md` sections: **What Is This?**, **How It Works**, **Install Options**, **Supported Agents**, **Real-World Examples**. |
| `/skills` | Browse all skills with summaries, trigger keywords, impact mix, and rule counts. | `skills/*/SKILL.md`, `skills/*/metadata.json`, `skills/*/rules/*.md`. |
| `/skills/[slug]` | Detail page for a single skill with full description, trigger terms, rules, references, and metadata. | `skills/<slug>/SKILL.md`, `skills/<slug>/metadata.json`, `skills/<slug>/rules/*.md`, `skills/<slug>/references/*`. |
| `/docs` | Documentation index linking install, usage, and conceptual docs. | Curated from `README.md`, `CONTRIBUTING.md`, and generated docs pages. |
| `/docs/cli` | CLI install/remove/update usage and agent targeting. | `README.md` (**Installation**, **Install Options**, **Check for updates**, **Remove skills**). |
| `/docs/faq` | FAQ for triggering behavior, skill loading levels, and troubleshooting. | `README.md` (**How It Works**, trigger examples), selected references from skills. |
| `/audit` | Repository audit dashboard (coverage + consistency checks). | `skills/*/SKILL.md`, `skills/*/rules/*.md`, `skills/*/metadata.json` aggregated. |
| `/about` | Project mission, standards, and contribution entrypoint. | `README.md`, `CONTRIBUTING.md`, `AGENTS.md`. |

---

## 2) Shared Content Schema

```ts
export type Impact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface Skill {
  /** from SKILL.md frontmatter:name and metadata.json:name */
  name: string
  /** from SKILL.md frontmatter:description (full block text) */
  description: string
  /** extracted trigger terms from SKILL.md frontmatter:description */
  triggers: string[]
  /** from metadata.json:ruleCount (fallback = rules.length) */
  rule_count: number
  /** from skill references directory; relative links + titles */
  references: Array<{
    path: string
    title: string
  }>
  /** pass-through metadata from metadata.json */
  metadata: {
    version?: string
    author?: string
    license?: string
    abstract?: string
    categories?: string[]
    tags?: string[]
    [key: string]: unknown
  }
}

export interface Rule {
  /** parsed from rules/*.md "**Impact: ...**" */
  impact: Impact
  /** parsed from first H1 in rule file */
  title: string
  /** extracted code blocks under Rule / Anti-Pattern sections */
  examples: Array<{
    kind: 'correct' | 'wrong' | 'neutral'
    language: string
    snippet: string
  }>
}

export type InstallCommand =
  | { variant: 'all_global'; command: string }
  | { variant: 'all_project'; command: string }
  | { variant: 'specific_skills'; command: string; skills: string[] }
  | { variant: 'target_agent'; command: string; agent: string }
  | { variant: 'team_onboarding'; command: string; ci_friendly: true }
  | { variant: 'maintenance'; command: string; operation: 'check' | 'update' | 'remove_one' | 'remove_all' }
```

### Source-of-truth field mapping

- `Skill.name` → `skills/<slug>/SKILL.md` frontmatter `name` (validated against `metadata.json.name`).
- `Skill.description` → `skills/<slug>/SKILL.md` frontmatter `description`.
- `Skill.triggers` → parsed from the description block (tokens/phrases such as annotations, APIs, and error names).
- `Skill.rule_count` → `skills/<slug>/metadata.json.ruleCount`.
- `Skill.references` → list from `skills/<slug>/references/*`, optionally enriched by links present in `SKILL.md`.
- `Skill.metadata` → full object from `skills/<slug>/metadata.json`.
- `Rule.impact` → `**Impact: ...**` line in each `skills/<slug>/rules/*.md`.
- `Rule.title` → first Markdown heading in each rule file.
- `Rule.examples` → fenced code blocks; classify by nearby markers (`✅`, `❌`, or section heading).

---

## 3) Data ingestion notes (repo-backed)

1. Enumerate skills by directory glob: `skills/*/`.
2. For each skill:
   - Parse frontmatter from `SKILL.md`.
   - Parse JSON in `metadata.json`.
   - Load `rules/*.md` and extract impact/title/examples.
   - Load `references/*` as lightweight docs metadata (path + first heading).
3. Build normalized records keyed by `slug` (`name` should match folder).
4. Expose route-level queries:
   - `/skills`: all `Skill` summaries + impact counts.
   - `/skills/[slug]`: one `Skill` + all `Rule` + references.
   - `/audit`: consistency checks (missing impact, mismatched ruleCount, unlinked references).

---

## 4) README → Website copy map

| README source section | Website section | Route | Notes |
|---|---|---|---|
| `## What Is This?` | **Value proposition** | `/` | Hero copy + “Without skills / With skills” contrast block. |
| `## How It Works - The Full Picture` | **How it works** | `/` and `/docs/faq` | Keep the 3-level loading model and trigger-chain explanation. |
| `## Install Options` + install snippets in top section | **Install options** | `/docs/cli` (summary teaser on `/`) | Model each command as an `InstallCommand` variant. |
| `## Supported Agents` | **Supported agents** | `/` and `/docs` | Reuse support matrix table; preserve notes and warning states. |
| `## Real-World Examples` | **Examples** | `/` and `/docs/faq` | Promote to cards linked to relevant skill detail pages. |

---

## 5) Suggested initial page composition

- `/`
  - Hero (value prop)
  - How it works (3-step condensed)
  - Supported agents row
  - Install options teaser
  - Real-world examples carousel
- `/skills`
  - Search + filters (tag, impact, rule count)
  - Skill cards (description, triggers, counts)
- `/skills/[slug]`
  - Skill header + metadata
  - Trigger chips
  - Rules grouped by impact
  - References panel
- `/audit`
  - Health summary cards
  - Per-skill validation table
  - Actionable inconsistencies
