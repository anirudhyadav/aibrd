from datetime import date
from ..llm.client import call_llm_json
from ..models.outputs import Conflict, BusinessRule

_SYSTEM = """You are a business analyst reviewing business rules for contradictions.
Find pairs of rules that directly conflict with each other.
Return JSON: {"conflicts": [{"rule_a": "...", "rule_b": "...", "description": "..."}]}"""


def detect_conflicts(rules: list[BusinessRule]) -> list[Conflict]:
    if len(rules) < 2:
        return []
    rules_text = "\n".join(f"{r.id}: {r.description}" for r in rules)
    raw = call_llm_json(rules_text, _SYSTEM)
    return [Conflict(**c) for c in raw.get("conflicts", [])]


def format_conflict_report(conflicts: list[Conflict]) -> str:
    today = date.today().isoformat()
    lines = ["# Conflict Report", f"_Generated: {today}_", ""]
    if not conflicts:
        lines.append("No conflicts detected.")
        return "\n".join(lines)

    lines.append("> Rule pairs that contradict each other. Resolve before development.")
    lines.append("")
    for i, c in enumerate(conflicts, 1):
        lines += [
            f"## Conflict {i}",
            f"- **Rule A:** {c.rule_a}",
            f"- **Rule B:** {c.rule_b}",
            f"- **Issue:** {c.description}",
            "",
        ]
    return "\n".join(lines)
