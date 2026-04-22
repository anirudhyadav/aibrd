from ..llm.client import call_llm_json

_SYSTEM = """You are a business analyst extracting actors from a BRD.
An actor is any person, system, or role that interacts with the system.
Return JSON: {"actors": [{"name": "...", "description": "..."}]}"""


def extract_actors(brd_text: str) -> list[dict]:
    result = call_llm_json(brd_text, _SYSTEM)
    return result.get("actors", [])
