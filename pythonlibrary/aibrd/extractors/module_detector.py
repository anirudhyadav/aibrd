from ..llm.client import call_llm_json
from ..models.module import DetectedModule
from ..registry import derive_prefix

_DETECT_SYSTEM = """You are a business analyst. Detect major business domains/modules in this BRD.
Rules:
- A module is a distinct business capability (e.g. "Payment Processing", "User Authentication")
- Ignore generic sections: Introduction, Glossary, Appendix, Overview
- Use short display names (2-3 words)
- Slugs must be lowercase, hyphen-separated
- Return 1 module for small/single-domain BRDs
Return JSON: {"modules": [{"display_name": "...", "slug": "...", "confidence": "high|low"}]}"""

_MATCH_SYSTEM = """You are a business analyst. Given a list of existing modules and a new requirement,
determine which module it belongs to, or suggest a new one if none fit.
Return JSON: {"slug": "existing-or-new-slug", "display_name": "...", "is_new": true|false, "confidence": "high|low"}"""


def detect_modules(brd_text: str) -> list[DetectedModule]:
    raw = call_llm_json(brd_text[:12000], _DETECT_SYSTEM)
    prefixes_seen: list[str] = []
    result = []
    for m in raw.get("modules", []):
        prefix = derive_prefix(m["slug"], prefixes_seen)
        prefixes_seen.append(prefix)
        result.append(DetectedModule(
            display_name=m["display_name"],
            slug=m["slug"],
            prefix=prefix,
            confidence=m.get("confidence", "high"),
        ))
    return result


def match_or_create_module(
    requirement_text: str,
    existing: list[DetectedModule],
) -> DetectedModule:
    if not existing:
        detected = detect_modules(requirement_text)
        return detected[0] if detected else DetectedModule(
            display_name="General", slug="general", prefix="GEN", confidence="low"
        )

    module_list = "\n".join(f"{m.slug}: {m.display_name}" for m in existing)
    prompt = f"Existing modules:\n{module_list}\n\nNew requirement:\n{requirement_text}"
    result = call_llm_json(prompt, _MATCH_SYSTEM)

    if not result.get("is_new"):
        matched = next((m for m in existing if m.slug == result["slug"]), None)
        if matched:
            return matched

    existing_prefixes = [m.prefix for m in existing]
    prefix = derive_prefix(result["slug"], existing_prefixes)
    return DetectedModule(
        display_name=result["display_name"],
        slug=result["slug"],
        prefix=prefix,
        confidence=result.get("confidence", "low"),
    )
