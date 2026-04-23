"""Sprint task generator — converts BRD content into developer sprint tasks."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal
from datetime import date

from ..llm.client import call_llm_json
from ..models.outputs import BRDContent


Priority = Literal["high", "medium", "low"]


@dataclass
class SprintTask:
    id: str
    title: str
    requirement_ids: list[str]
    acceptance_criteria: list[str]
    story_points: int
    priority: Priority
    module: str | None = None


SYSTEM = """You are a senior tech lead converting business requirements into sprint tasks.
For each business flow or feature, create a developer task with:
- A clear action title (verb-first)
- Which requirement IDs it covers
- Acceptance criteria (from AC-XXX items)
- Story point estimate (1, 2, 3, 5, 8, 13)
- Priority based on dependencies (high/medium/low)
Return JSON: { "tasks": [{ "title": "...", "requirementIds": ["BF-001"], "acceptanceCriteria": ["..."], "storyPoints": 3, "priority": "high" }] }"""


def generate_sprint_feed(content: BRDContent) -> list[SprintTask]:
    """Generate sprint tasks from BRD content."""
    brd_summary = "\n".join([
        *[f"{f.id}: {f.name} — {f.description}" for f in content.flows],
        *[f"{r.id}: {r.description}" for r in content.rules],
        *[f"{ac.id}: Given {ac.given} / When {ac.when} / Then {ac.then}" for ac in content.criteria],
    ])

    raw = call_llm_json(brd_summary, SYSTEM)
    tasks = raw.get("tasks", [])
    return [
        SprintTask(
            id=f"TASK-{str(i + 1).zfill(3)}",
            title=t["title"],
            requirement_ids=t.get("requirementIds", []),
            acceptance_criteria=t.get("acceptanceCriteria", []),
            story_points=t.get("storyPoints", 3),
            priority=t.get("priority", "medium"),
            module=content.module_slug,
        )
        for i, t in enumerate(tasks)
    ]


def format_sprint_feed(tasks: list[SprintTask], project_name: str) -> str:
    today = date.today().isoformat()
    total_pts = sum(t.story_points for t in tasks)
    lines = [
        f"# Sprint Feed — {project_name}",
        f"_Generated: {today} | {len(tasks)} tasks · {total_pts} story points_",
        "",
    ]

    for priority in ("high", "medium", "low"):
        filtered = [t for t in tasks if t.priority == priority]
        if not filtered:
            continue
        emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[priority]
        lines += [f"## {emoji} {priority.capitalize()} Priority", ""]
        for task in filtered:
            lines.append(f"### {task.id}: {task.title}")
            lines.append(f"**Story Points:** {task.story_points}")
            if task.module:
                lines.append(f"**Module:** {task.module}")
            lines.append(f"**Traces:** {', '.join(task.requirement_ids)}")
            if task.acceptance_criteria:
                lines.append("**Acceptance Criteria:**")
                for ac in task.acceptance_criteria:
                    lines.append(f"- [ ] {ac}")
            lines.append("")

    lines += ["## Summary Table", ""]
    lines.append("| Task | Priority | Points | Requirements |")
    lines.append("|---|---|---|---|")
    for t in tasks:
        lines.append(f"| {t.id}: {t.title} | {t.priority} | {t.story_points} | {', '.join(t.requirement_ids)} |")

    return "\n".join(lines)


def format_sprint_feed_as_github_issues(tasks: list[SprintTask]) -> str:
    """Return newline-delimited JSON for GitHub Issues API."""
    import json
    results = []
    for t in tasks:
        body_lines = [
            f"**Traces:** {', '.join(t.requirement_ids)}",
            f"**Story Points:** {t.story_points}",
            "",
            "## Acceptance Criteria",
            *[f"- [ ] {ac}" for ac in t.acceptance_criteria],
        ]
        results.append(json.dumps({
            "title": f"[{t.id}] {t.title}",
            "body": "\n".join(body_lines),
            "labels": [l for l in [t.priority, t.module or "general"] if l],
        }))
    return "\n".join(results)
