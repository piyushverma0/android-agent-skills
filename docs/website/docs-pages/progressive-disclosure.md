# ANDROID-SKILL Docs: Progressive Disclosure

The platform uses a 3-level loading model to keep context efficient.

## Level 1: Name + description (always loaded)

- Lightweight routing metadata for automatic trigger matching.
- Expected token footprint is small for all skills together.

## Level 2: Full SKILL.md (loaded on trigger)

- Complete operational rules for the matched skill.
- Includes critical patterns, wrong/correct examples, and implementation guidance.

## Level 3: references/ files (on-demand)

- Deep-dive material loaded only if needed.
- Example: animation references only when animation work is requested.

## Why this matters

- Lower context cost.
- Better first-attempt correctness.
- Scales to more skills without bloating every prompt.
