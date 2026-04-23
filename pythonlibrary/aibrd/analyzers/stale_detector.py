"""Stale requirement detector — cross-references CONTEXT.md IDs against git history."""

from __future__ import annotations
import re
import subprocess
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path


STALE_DAYS = 30
DRIFT_DAYS = 14


@dataclass
class StaleRequirement:
    requirement_id: str
    requirement_title: str
    last_context_update: str
    last_code_touch: str
    days_drift: int
    matched_files: list[str]
    verdict: str  # 'stale' | 'drifted' | 'ok'


@dataclass
class StalenessReport:
    stale_count: int
    drifted_count: int
    ok_count: int
    items: list[StaleRequirement] = field(default_factory=list)


def _git(args: list[str], cwd: str) -> str:
    try:
        return subprocess.check_output(
            ["git", "-C", cwd, *args], encoding="utf-8", stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return ""


def detect_stale_requirements(
    aibrd_dir: str,
    workspace_root: str,
    slug: str | None = None,
) -> list[StaleRequirement]:
    ctx_path = (
        Path(aibrd_dir) / "modules" / slug / "CONTEXT.md"
        if slug
        else Path(aibrd_dir) / "CONTEXT.md"
    )
    if not ctx_path.exists():
        return []

    text = ctx_path.read_text(encoding="utf-8")
    rel_ctx = str(ctx_path.relative_to(workspace_root))
    ctx_last = _git(["log", "-1", "--format=%aI", "--", rel_ctx], workspace_root) or datetime.now(timezone.utc).isoformat()

    now = datetime.now(timezone.utc)
    results: list[StaleRequirement] = []

    for m in re.finditer(r"###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)", text):
        req_id, title = m.group(1), m.group(2).strip()

        # Find test/source files referencing this ID
        grep_out = _git(["grep", "-rl", req_id, "--", "*.ts", "*.tsx", "*.js", "*.py", "*.java"], workspace_root)
        matched = [f for f in grep_out.split("\n") if f] if grep_out else []

        last_touch = ctx_last
        if matched:
            file_args = ["log", "-1", "--format=%aI", "--"] + matched
            last_touch = _git(file_args, workspace_root) or ctx_last

        try:
            touch_dt = datetime.fromisoformat(last_touch.replace("Z", "+00:00"))
            days_drift = (now - touch_dt).days
        except Exception:
            days_drift = 0

        verdict = "stale" if days_drift >= STALE_DAYS else ("drifted" if days_drift >= DRIFT_DAYS else "ok")
        results.append(StaleRequirement(
            requirement_id=req_id,
            requirement_title=title,
            last_context_update=ctx_last[:10],
            last_code_touch=last_touch[:10],
            days_drift=days_drift,
            matched_files=matched,
            verdict=verdict,
        ))

    return results


def build_staleness_report(items: list[StaleRequirement]) -> StalenessReport:
    return StalenessReport(
        stale_count=sum(1 for i in items if i.verdict == "stale"),
        drifted_count=sum(1 for i in items if i.verdict == "drifted"),
        ok_count=sum(1 for i in items if i.verdict == "ok"),
        items=items,
    )


def format_staleness_report(report: StalenessReport, slug: str | None = None) -> str:
    today = date.today().isoformat()
    scope = f" — {slug}" if slug else ""
    lines = [
        f"# Staleness Report{scope}",
        f"_Generated: {today}_",
        "",
        f"> **{report.stale_count}** stale · **{report.drifted_count}** drifting · **{report.ok_count}** ok",
        "",
    ]

    groups = [
        ("stale", "🔴 Stale (>30 days no code activity)"),
        ("drifted", "🟡 Drifting (14–30 days)"),
        ("ok", "🟢 Up to date"),
    ]

    for verdict, label in groups:
        subset = [i for i in report.items if i.verdict == verdict]
        if not subset:
            continue
        lines += [f"## {label}", ""]
        lines.append("| Requirement | Last Code Touch | Days | Files Matched |")
        lines.append("|---|---|---|---|")
        for item in subset:
            files = ", ".join(item.matched_files[:3])
            if len(item.matched_files) > 3:
                files += "…"
            if not files:
                files = "_none_"
            lines.append(f"| **{item.requirement_id}**: {item.requirement_title[:40]} | {item.last_code_touch} | {item.days_drift} | {files} |")
        lines.append("")

    return "\n".join(lines)
