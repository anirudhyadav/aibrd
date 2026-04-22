from datetime import date
from ..llm.client import call_llm_json
from ..models.outputs import Ambiguity

_SYSTEM = """You are a business analyst reviewing a BRD for ambiguities.
Flag vague terms lacking measurable definitions (e.g. "fast", "intuitive", "soon", "large").
Return JSON: {"ambiguities": [{"term": "...", "context": "...", "suggestion": "..."}]}"""


def detect_ambiguities(brd_text: str) -> list[Ambiguity]:
    raw = call_llm_json(brd_text, _SYSTEM)
    return [
        Ambiguity(id=f"AMB-{i+1:03d}", **a)
        for i, a in enumerate(raw.get("ambiguities", []))
    ]


def format_ambiguity_report(ambiguities: list[Ambiguity]) -> str:
    today = date.today().isoformat()
    lines = [
        "# Ambiguity Report",
        f"_Generated: {today}_",
        "",
        "> Terms flagged as vague or unmeasurable. Resolve before sprint planning.",
        "",
    ]
    if not ambiguities:
        lines.append("No ambiguities detected.")
        return "\n".join(lines)

    for a in ambiguities:
        lines += [
            f'## {a.id}: "{a.term}"',
            f"**Found in:** _{a.context}_",
            f"**Suggestion:** {a.suggestion}",
            "",
        ]
    return "\n".join(lines)
