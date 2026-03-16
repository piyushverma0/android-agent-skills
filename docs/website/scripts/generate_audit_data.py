#!/usr/bin/env python3
"""Generate static audit JSON for ANDROID-SKILL by scanning skills markdown + metadata.

Usage:
  python docs/website/scripts/generate_audit_data.py --output docs/website/audit-data/audit-report.json
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List

STATUS_PASS = "pass"
STATUS_WARN = "warn"
STATUS_FAIL = "fail"


@dataclass
class CheckResult:
    status: str
    message: str


@dataclass
class SkillAudit:
    slug: str
    completeness: Dict[str, CheckResult]
    compliance: Dict[str, CheckResult]
    freshness: Dict[str, CheckResult]
    documentation: Dict[str, CheckResult]
    score: int


def status_score(status: str) -> int:
    return {STATUS_PASS: 1, STATUS_WARN: 0, STATUS_FAIL: -1}.get(status, -1)


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def has_frontmatter(skill_text: str) -> bool:
    return bool(re.match(r"^---\n.*?\n---\n", skill_text, flags=re.S))


def extract_description(skill_text: str) -> str:
    m = re.search(r"^description:\s*\|\n(.*?)(?:\n[a-zA-Z_\-]+:\s|\n---\n)", skill_text, flags=re.S | re.M)
    return (m.group(1).strip() if m else "")


def has_common_mistakes(skill_text: str, rules_texts: List[str]) -> bool:
    if "Common Mistakes" in skill_text:
        return True
    return any("Common Mistakes" in text or "Anti-Patterns" in text for text in rules_texts)


def check_compliance(skill_text: str, rules_texts: List[str]) -> Dict[str, CheckResult]:
    all_text = "\n".join([skill_text] + rules_texts)
    low = all_text.lower()

    hilt_mentions = "hilt" in low
    koin_mentions = "koin" in low
    dagger_mentions = "bare dagger" in low
    flow_mentions = "flow" in low or "stateflow" in low or "sharedflow" in low
    livedata_mentions = "livedata" in low

    deprecated_terms = ["asynctask", "loadermanager", "synthetic"]
    deprecated_hits = [term for term in deprecated_terms if term in low]

    return {
        "hilt_only": CheckResult(
            STATUS_WARN if koin_mentions or dagger_mentions else (STATUS_PASS if hilt_mentions else STATUS_WARN),
            "Koin/bare Dagger mentions found" if (koin_mentions or dagger_mentions) else "Hilt-aligned guidance",
        ),
        "flow_over_livedata": CheckResult(
            STATUS_WARN if livedata_mentions else (STATUS_PASS if flow_mentions else STATUS_WARN),
            "LiveData mentioned" if livedata_mentions else "Flow-first guidance detected",
        ),
        "no_deprecated_patterns": CheckResult(
            STATUS_FAIL if deprecated_hits else STATUS_PASS,
            f"Deprecated terms found: {', '.join(deprecated_hits)}" if deprecated_hits else "No deprecated API patterns detected",
        ),
    }


def latest_mtime(paths: List[Path]) -> float:
    return max((p.stat().st_mtime for p in paths), default=0.0)


def freshness_check(last_updated_unix: float) -> CheckResult:
    # We do not enforce absolute date thresholds in docs-only repos, so mark pass if present.
    if last_updated_unix <= 0:
        return CheckResult(STATUS_WARN, "No timestamp found")
    return CheckResult(STATUS_PASS, "Timestamp captured from repository files")


def documentation_coverage(skill_text: str, has_references: bool) -> Dict[str, CheckResult]:
    has_setup = "## Setup" in skill_text
    has_rules = "##" in skill_text and "Rule" in skill_text

    return {
        "setup_section": CheckResult(STATUS_PASS if has_setup else STATUS_WARN, "Setup section present" if has_setup else "Setup section missing"),
        "rule_sections": CheckResult(STATUS_PASS if has_rules else STATUS_WARN, "Rule sections detected" if has_rules else "Rule sections not clearly detected"),
        "references_present": CheckResult(STATUS_PASS if has_references else STATUS_WARN, "Reference files found" if has_references else "No references directory content"),
    }


def audit_skill(skill_dir: Path) -> SkillAudit:
    slug = skill_dir.name
    skill_md = skill_dir / "SKILL.md"
    meta_json = skill_dir / "metadata.json"
    rules_dir = skill_dir / "rules"
    refs_dir = skill_dir / "references"

    skill_text = load_text(skill_md) if skill_md.exists() else ""
    metadata = json.loads(load_text(meta_json)) if meta_json.exists() else {}

    rule_files = sorted(rules_dir.glob("*.md")) if rules_dir.exists() else []
    rules_texts = [load_text(p) for p in rule_files]
    ref_files = sorted(refs_dir.glob("*.md")) if refs_dir.exists() else []

    completeness: Dict[str, CheckResult] = {
        "frontmatter": CheckResult(STATUS_PASS if has_frontmatter(skill_text) else STATUS_FAIL, "YAML frontmatter detected" if has_frontmatter(skill_text) else "Missing YAML frontmatter"),
        "common_mistakes": CheckResult(STATUS_PASS if has_common_mistakes(skill_text, rules_texts) else STATUS_WARN, "Common mistakes/anti-pattern guidance found" if has_common_mistakes(skill_text, rules_texts) else "No common mistakes section found"),
        "rule_count": CheckResult(
            STATUS_PASS if metadata.get("ruleCount") == len(rule_files) else STATUS_WARN,
            f"metadata.ruleCount={metadata.get('ruleCount')} rules_dir={len(rule_files)}",
        ),
        "reference_count": CheckResult(STATUS_PASS if len(ref_files) > 0 else STATUS_WARN, f"references={len(ref_files)}"),
    }

    compliance = check_compliance(skill_text, rules_texts)

    all_paths = [p for p in [skill_md, meta_json] if p.exists()] + rule_files + ref_files
    freshness = {
        "last_updated": freshness_check(latest_mtime(all_paths)),
    }

    documentation = documentation_coverage(skill_text, has_references=len(ref_files) > 0)

    checks = [*completeness.values(), *compliance.values(), *freshness.values(), *documentation.values()]
    score = int((sum(max(status_score(c.status), 0) for c in checks) / max(len(checks), 1)) * 100)

    return SkillAudit(
        slug=slug,
        completeness=completeness,
        compliance=compliance,
        freshness=freshness,
        documentation=documentation,
        score=score,
    )


def compute_global_score(audits: List[SkillAudit]) -> int:
    if not audits:
        return 0
    return int(sum(a.score for a in audits) / len(audits))


def status_badge(score: int) -> str:
    if score >= 85:
        return STATUS_PASS
    if score >= 60:
        return STATUS_WARN
    return STATUS_FAIL


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skills-root", default="skills")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    skills_root = Path(args.skills_root)
    skill_dirs = sorted([p for p in skills_root.iterdir() if p.is_dir()])

    audits = [audit_skill(skill_dir) for skill_dir in skill_dirs]
    global_score = compute_global_score(audits)

    payload = {
        "platform": "ANDROID-SKILL",
        "globalScore": global_score,
        "globalBadge": status_badge(global_score),
        "skills": [
            {
                "slug": a.slug,
                "score": a.score,
                "badge": status_badge(a.score),
                "completeness": {k: asdict(v) for k, v in a.completeness.items()},
                "compliance": {k: asdict(v) for k, v in a.compliance.items()},
                "freshness": {k: asdict(v) for k, v in a.freshness.items()},
                "documentation": {k: asdict(v) for k, v in a.documentation.items()},
            }
            for a in audits
        ],
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Generated audit report: {output}")


if __name__ == "__main__":
    main()
