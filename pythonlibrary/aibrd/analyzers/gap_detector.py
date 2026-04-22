from datetime import date
from ..llm.client import call_llm_json
from ..models.outputs import GapResult

_SYSTEM = """You are a software auditor comparing requirements against code.
For each requirement, determine if the code covers it.
Return JSON: {"gaps": [{"requirement_id": "...", "requirement_summary": "...",
"status": "covered|partial|missing", "reason": "..."}]}"""


def detect_gaps(context_content: str, code_snippets: str) -> list[GapResult]:
    max_chars = 12000
    prompt = (
        f"REQUIREMENTS:\n{context_content[:max_chars // 2]}\n\n"
        f"CODE:\n{code_snippets[:max_chars // 2]}"
    )
    raw = call_llm_json(prompt, _SYSTEM)
    return [GapResult(**g) for g in raw.get("gaps", [])]


def format_gap_report(gaps: list[GapResult]) -> str:
    today = date.today().isoformat()
    missing = [g for g in gaps if g.status == "missing"]
    partial = [g for g in gaps if g.status == "partial"]
    covered = [g for g in gaps if g.status == "covered"]

    lines = [
        "# Gap Report",
        f"_Generated: {today}_",
        "",
        f"**Summary:** {len(covered)} covered · {len(partial)} partial · {len(missing)} missing",
        "",
    ]
    if missing:
        lines += ["## ❌ Missing Coverage", ""]
        for g in missing:
            lines += [f"### {g.requirement_id}: {g.requirement_summary}", g.reason, ""]
    if partial:
        lines += ["## ⚠️ Partial Coverage", ""]
        for g in partial:
            lines += [f"### {g.requirement_id}: {g.requirement_summary}", g.reason, ""]

    return "\n".join(lines)
