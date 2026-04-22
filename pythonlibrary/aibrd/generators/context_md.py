from datetime import date
from ..models.outputs import BRDContent


def generate_context_md(content: BRDContent, version: str = "1.0") -> str:
    today = date.today().isoformat()
    module_label = f"Module: {content.module_slug} | " if content.module_slug else ""
    lines = [f"# CONTEXT.md", f"_{module_label}v{version} | Updated: {today}_", ""]

    if content.actors:
        lines += ["## Actors", ""]
        for a in content.actors:
            lines.append(f"- **{a.id}**: {a.name} — {a.description}")
        lines.append("")

    if content.flows:
        lines += ["## Business Flows", ""]
        for f in content.flows:
            lines.append(f"### {f.id}: {f.name}")
            lines.append(f.description)
            lines.append("")
            if f.steps:
                lines.append("**Steps:**")
                for s in f.steps:
                    actor = f" _({s.actor})_" if s.actor else ""
                    lines.append(f"{s.order}. {s.description}{actor}")
                lines.append("")
            if f.related_rules:
                lines.append(f"_Rules: {', '.join(f.related_rules)}_")
            if f.related_ac:
                lines.append(f"_AC: {', '.join(f.related_ac)}_")
            lines.append("")

    if content.rules:
        lines += ["## Business Rules", ""]
        for r in content.rules:
            lines.append(f"### {r.id}")
            lines.append(r.description)
            if r.rationale:
                lines.append(f"> {r.rationale}")
            if r.related_flows:
                lines.append(f"_Flows: {', '.join(r.related_flows)}_")
            lines.append("")

    if content.criteria:
        lines += ["## Acceptance Criteria", ""]
        for ac in content.criteria:
            lines.append(f"### {ac.id}")
            lines.append(f"- **Given** {ac.given}")
            lines.append(f"- **When** {ac.when}")
            lines.append(f"- **Then** {ac.then}")
            if ac.related_flow:
                lines.append(f"_Flow: {ac.related_flow}_")
            if ac.related_rules:
                lines.append(f"_Rules: {', '.join(ac.related_rules)}_")
            lines.append("")

    lines += ["## Changelog", "", f"- {today} v{version}: Initial generation from BRD", ""]
    return "\n".join(lines)


def changelog_entry(version: str, description: str) -> str:
    return f"- {date.today().isoformat()} v{version}: {description}"
