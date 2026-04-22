from ..llm.client import call_llm_json

_SYSTEM = """You are a business analyst extracting business rules from a BRD.
A business rule is a constraint, policy, or condition the system must enforce.
Return JSON: {"rules": [{"description": "...", "rationale": "..."}]}"""


def extract_rules(brd_text: str) -> list[dict]:
    result = call_llm_json(brd_text, _SYSTEM)
    return result.get("rules", [])
