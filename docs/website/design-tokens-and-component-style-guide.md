# ANDROID-SKILL Design Tokens and Component Style Guide

This guide defines a **distinct** visual system for ANDROID-SKILL with a dark, developer-first feel while intentionally diverging from the inspiration:

- Different grid rhythm: **12-column, 72px baseline rhythm, 24px gutters**.
- Different typography pairing: **Space Grotesk + IBM Plex Mono**.
- Different nav proportions: **56px compact nav on desktop, 64px on tablet/mobile**.
- Distinct card/table treatment: **soft-border cards + elevated row highlight tables**.

---

## 1) Design Tokens

## Color Tokens

### Core dark surfaces

| Token | Hex | Usage |
|---|---|---|
| `--bg-canvas` | `#07090F` | page background |
| `--bg-elev-1` | `#0E1320` | cards, command box |
| `--bg-elev-2` | `#131A2B` | hover / selected panels |
| `--bg-elev-3` | `#1A2338` | active states |
| `--border-subtle` | `#24314D` | standard borders |
| `--border-strong` | `#38507A` | focus-adjacent borders |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#EEF4FF` | primary copy |
| `--text-secondary` | `#A7B4CD` | body/supporting text |
| `--text-muted` | `#7E8CA8` | metadata labels |
| `--text-inverse` | `#04060B` | text on bright chips/buttons |

### Brand + semantic

| Token | Hex | Usage |
|---|---|---|
| `--brand-primary` | `#7DD3FC` | links, highlights |
| `--brand-accent` | `#A78BFA` | secondary accent |
| `--brand-success` | `#34D399` | pass states |
| `--brand-warning` | `#FBBF24` | warning states |
| `--brand-danger` | `#FB7185` | error states |
| `--impact-critical` | `#FB7185` | critical impact chips |
| `--impact-high` | `#F97316` | high impact chips |
| `--impact-medium` | `#FBBF24` | medium impact chips |
| `--impact-low` | `#38BDF8` | low impact chips |

### Gradients

- `--gradient-hero`: `linear-gradient(135deg, #7DD3FC 0%, #A78BFA 45%, #34D399 100%)`
- `--gradient-outline`: `linear-gradient(120deg, rgba(125,211,252,.65), rgba(167,139,250,.45))`

## Typography Tokens

- Display / headings: **Space Grotesk**
- Code / CLI / metadata: **IBM Plex Mono**

| Token | Value |
|---|---|
| `--font-display` | `"Space Grotesk", system-ui, sans-serif` |
| `--font-body` | `"Space Grotesk", system-ui, sans-serif` |
| `--font-mono` | `"IBM Plex Mono", ui-monospace, monospace` |
| `--text-xs` | `12px / 18px` |
| `--text-sm` | `14px / 20px` |
| `--text-md` | `16px / 24px` |
| `--text-lg` | `20px / 30px` |
| `--text-xl` | `28px / 36px` |
| `--text-2xl` | `40px / 48px` |

## Spacing + Layout Tokens

- Base unit: `4px`
- Rhythm scale: `4, 8, 12, 16, 24, 32, 40, 56, 72`

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-14` | `56px` |
| `--space-18` | `72px` |
| `--max-content` | `1200px` |
| `--grid-columns` | `12` |
| `--grid-gutter` | `24px` |

## Radius + Shadow Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | chips |
| `--radius-md` | `12px` | buttons, inputs |
| `--radius-lg` | `18px` | cards |
| `--radius-xl` | `24px` | hero panels |
| `--shadow-sm` | `0 2px 12px rgba(0,0,0,.28)` | subtle surfaces |
| `--shadow-md` | `0 10px 30px rgba(0,0,0,.34)` | elevated cards |
| `--shadow-lg` | `0 18px 48px rgba(0,0,0,.44)` | hero/overlays |
| `--ring-focus` | `0 0 0 3px rgba(125,211,252,.55)` | keyboard focus ring |

---

## 2) Reusable Component Style Guide

## Top Nav

- Height: `56px` desktop, `64px` mobile.
- Content distribution: left (brand + slash breadcrumb), right (Docs / Audit / GitHub).
- Background: `rgba(7,9,15,.72)` with backdrop blur.
- Border bottom: `1px solid var(--border-subtle)`.
- Links: medium weight with 8px underline offset on hover.
- Internal links: `/docs`, `/audit` always visible.

## Install Command Box

- Monospace command text with copy button at right.
- Container: `bg-elev-1`, `radius-lg`, `border-subtle`.
- Primary command:

```bash
npx skills add piyushverma0/android-agent-skills
```

- Copy interaction: optimistic “Copied” state for 2 seconds.
- Add aria-live region for copy confirmation.

## Skill Cards

- Card layout: title, short description, trigger chips, impact distribution strip, install count placeholder.
- Card style: elevated with subtle border and top gradient edge (not full neon).
- Hover: translateY(-2px) + border to `--border-strong`.
- Include direct links: `/skills/[slug]`, `/docs`, `/audit`.

## Metric Chips

- Pill chips for facts and impact tags.
- Use strong contrast text and icon + label format.
- Examples:
  - `5 Skills`
  - `68 Rules`
  - `3-level Progressive Disclosure`
  - `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`

## Docs Sidebar

- Width: `280px` desktop, collapsible drawer mobile.
- Active item: filled `bg-elev-2` with 4px brand left border.
- Section grouping: Overview, CLI, FAQ, Architecture Notes, Audit Notes.
- Keep sticky behavior after `top: 72px`.

## Audit Table

- Dense developer table with status-first columns.
- Distinct treatment: row status stripe + pass/warn/fail icon rather than plain text.
- Columns: Skill, Frontmatter, Rule Count Match, Impact Coverage, Common Mistakes, References Linked, Last Updated.
- Sorting by status severity then skill name.
- Zebra rows using low-contrast overlays for scanability.

---

## 3) Accessibility Constraints (non-negotiable)

1. **Contrast**
   - Body text: minimum 4.5:1.
   - Large headings: minimum 3:1.
   - Chips/badges must keep 4.5:1 for text.
2. **Keyboard focus**
   - All interactive elements must show `--ring-focus`.
   - No focus traps on dialogs or mobile nav drawers.
   - Ensure logical tab order: nav → hero CTA → sections.
3. **ARIA labels + semantics**
   - Copy button: `aria-label="Copy install command"`.
   - Search/filter controls: explicit labels, not placeholder-only.
   - Tables: proper `<caption>`, `<th scope="col">`, and status text with icon.
   - Decorative icons marked `aria-hidden="true"`.
4. **Motion + preferences**
   - Respect `prefers-reduced-motion` and disable non-essential transforms.
5. **Touch targets**
   - Minimum 44x44px for button/chip interactions on mobile.
6. **Screen reader messaging**
   - Copy action and filter updates announced via `aria-live="polite"`.

---

## 4) Social proof and GitHub integration points

- Hero/right rail placeholders:
  - “Used by Android teams” logos (placeholder skeletons until assets are approved)
  - “Community activity” panel (placeholder)
- GitHub stats integration slot:
  - stars
  - forks
  - last updated
- Surface stats near CTA without blocking primary command action.
