"""Compliance mapper — tags requirements against GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO27001."""

from __future__ import annotations
from dataclasses import dataclass
from datetime import date
from typing import Literal

from ..llm.client import call_llm_json
from ..models.outputs import BRDContent


ComplianceFramework = Literal["GDPR", "WCAG", "HIPAA", "SOX", "PCI-DSS", "ISO27001"]
Risk = Literal["high", "medium", "low"]

ALL_FRAMEWORKS: list[ComplianceFramework] = ["GDPR", "WCAG", "HIPAA", "SOX", "PCI-DSS", "ISO27001"]


@dataclass
class ComplianceTag:
    requirement_id: str
    requirement_summary: str
    framework: ComplianceFramework
    clause: str
    rationale: str
    risk: Risk


SYSTEM = """You are a compliance specialist mapping business requirements to regulatory frameworks.
For each requirement, identify which compliance clauses apply.
Only tag requirements that have a genuine compliance relevance.
Return JSON: { "tags": [{
  "requirementId": "...",
  "requirementSummary": "...",
  "framework": "GDPR|WCAG|HIPAA|SOX|PCI-DSS|ISO27001",
  "clause": "e.g. GDPR Art. 17 — Right to erasure",
  "rationale": "why this applies",
  "risk": "high|medium|low"
}]}"""


def map_compliance(
    contents: list[BRDContent],
    frameworks: list[ComplianceFramework],
) -> list[ComplianceTag]:
    all_items = "\n".join(
        line
        for c in contents
        for line in (
            [f"{f.id}: {f.name} — {f.description}" for f in c.flows]
            + [f"{r.id}: {r.description}" for r in c.rules]
        )
    )

    prompt = f"FRAMEWORKS TO CHECK: {', '.join(frameworks)}\n\nREQUIREMENTS:\n{all_items}"
    raw = call_llm_json(prompt, SYSTEM)
    tags = []
    for t in raw.get("tags", []):
        tags.append(ComplianceTag(
            requirement_id=t["requirementId"],
            requirement_summary=t.get("requirementSummary", ""),
            framework=t["framework"],
            clause=t["clause"],
            rationale=t["rationale"],
            risk=t["risk"],
        ))
    return tags


def format_compliance_map(tags: list[ComplianceTag]) -> str:
    today = date.today().isoformat()
    lines = [
        "# Compliance Map",
        f"_Generated: {today}_",
        "",
        "> Auto-generated mapping. Validate with your compliance team before submission.",
        "",
    ]

    if not tags:
        lines.append("No compliance tags detected for the selected frameworks.")
        return "\n".join(lines)

    by_framework: dict[str, list[ComplianceTag]] = {}
    for t in tags:
        by_framework.setdefault(t.framework, []).append(t)

    for fw, fw_tags in by_framework.items():
        lines += [f"## {fw}", ""]
        lines.append("| Requirement | Clause | Risk | Rationale |")
        lines.append("|---|---|---|---|")
        for t in fw_tags:
            risk_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[t.risk]
            lines.append(
                f"| {t.requirement_id}: {t.requirement_summary[:50]} | {t.clause} | {risk_emoji} {t.risk} | {t.rationale} |"
            )
        lines.append("")

    high_risk = [t for t in tags if t.risk == "high"]
    if high_risk:
        lines += ["## 🔴 High Risk Items — Action Required", ""]
        for t in high_risk:
            lines.append(f"- **{t.requirement_id}** ({t.framework} {t.clause}): {t.rationale}")

    return "\n".join(lines)
