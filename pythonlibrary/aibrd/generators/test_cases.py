from datetime import date
from ..models.outputs import BRDContent


def generate_test_cases(content: BRDContent) -> str:
    today = date.today().isoformat()
    prefix = content.module_prefix or ""
    lines = ["# Test Cases", f"_Generated: {today}_", ""]

    for ac in content.criteria:
        tc_id = ac.id.replace("AC", f"{prefix}-TC" if prefix else "TC")
        lines += [
            f"## {tc_id}",
            f"_Traces: {ac.id}{', ' + ac.related_flow if ac.related_flow else ''}_",
            "",
            "```gherkin",
            f"Scenario: {ac.when}",
            f"  Given {ac.given}",
            f"  When {ac.when}",
            f"  Then {ac.then}",
            "```",
            "",
        ]

    for rule in content.rules:
        tc_id = rule.id.replace("BR", f"{prefix}-TC" if prefix else "TC")
        lines += [
            f"## {tc_id}-boundary",
            f"_Traces: {rule.id}_",
            "",
            "```gherkin",
            f"Scenario: Verify rule — {rule.description[:60]}",
            "  Given the system is operational",
            "  When the condition applies",
            f"  Then the rule is enforced: {rule.description}",
            "```",
            "",
        ]

    return "\n".join(lines)
