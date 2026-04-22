from datetime import date
from ..models.outputs import BRDContent


def generate_rtm(contents: list[BRDContent], project_name: str) -> str:
    today = date.today().isoformat()
    lines = [
        "# index.md — Requirement Traceability Matrix",
        f"_Project: {project_name} | Updated: {today}_",
        "",
    ]

    modules = [c.module_slug for c in contents if c.module_slug]
    if modules:
        lines += ["## Modules", ""]
        for slug in modules:
            lines.append(f"- [{slug}](modules/{slug}/CONTEXT.md)")
        lines.append("")

    lines += ["## Traceability Matrix", ""]
    lines.append("| ID | Requirement | Test Cases | Status |")
    lines.append("|---|---|---|---|")

    for content in contents:
        for flow in content.flows:
            tc_ids = [ac.id.replace("AC", "TC") for ac in content.criteria if ac.related_flow == flow.id]
            status = "✅" if tc_ids else "❌"
            tests = ", ".join(tc_ids) if tc_ids else "—"
            lines.append(f"| {flow.id} | {flow.name} | {tests} | {status} |")

        for rule in content.rules:
            lines.append(f"| {rule.id} | {rule.description[:60]} | — | ❌ |")

    lines += ["", "_Status: ✅ Covered · ⚠️ Partial · ❌ Missing_"]
    return "\n".join(lines)
