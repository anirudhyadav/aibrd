from ..llm.client import call_llm_json

_SYSTEM = """You are a QA analyst extracting acceptance criteria in Given/When/Then format from a BRD.
Return JSON: {"criteria": [{"given": "...", "when": "...", "then": "..."}]}"""


def extract_acceptance_criteria(brd_text: str) -> list[dict]:
    result = call_llm_json(brd_text, _SYSTEM)
    return result.get("criteria", [])
