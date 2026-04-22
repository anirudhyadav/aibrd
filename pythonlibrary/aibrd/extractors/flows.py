from ..llm.client import call_llm_json

_SYSTEM = """You are a business analyst extracting business flows from a BRD.
A business flow is an end-to-end process or user journey.
Return JSON: {"flows": [{"name": "...", "description": "...", "actors": ["actor name"],
"steps": [{"order": 1, "description": "...", "actor": "..."}]}]}"""


def extract_flows(brd_text: str) -> list[dict]:
    result = call_llm_json(brd_text, _SYSTEM)
    return result.get("flows", [])
