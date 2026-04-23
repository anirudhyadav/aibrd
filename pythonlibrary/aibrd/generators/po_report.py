"""PO progress report — plain-English summary for non-technical Product Owners."""

from __future__ import annotations
from datetime import date
import subprocess

from ..llm.client import call_llm
from ..models.outputs import BRDContent


SYSTEM = """You are a delivery manager writing a progress report for a non-technical Product Owner.
Compare what was asked for (requirements) against what was built (git changes).
Write in plain English — no requirement IDs visible to the reader, no technical jargon.
Use these sections:
## What Was Asked For
(plain English summary of all requirements)
## What Was Built
(plain English summary of what the git changes delivered)
## Still To Do
(plain English list of outstanding items)
## Risks & Notes
(anything the PO should know before sign-off)"""


def get_git_summary(repo_path: str, git_range: str = "HEAD~20..HEAD") -> str:
    """Collect git diff stat and commit log for the given range."""
    try:
        stat = subprocess.check_output(
            ["git", "-C", repo_path, "diff", "--stat", git_range],
            encoding="utf-8", stderr=subprocess.DEVNULL
        )
        log = subprocess.check_output(
            ["git", "-C", repo_path, "log", "--oneline", git_range],
            encoding="utf-8", stderr=subprocess.DEVNULL
        )
        return f"Commits:\n{log}\n\nFiles changed:\n{stat}"
    except Exception:
        return "Git history unavailable."


def generate_po_report(
    contents: list[BRDContent],
    git_summary: str,
    version: str,
) -> str:
    req_summary = "\n".join(
        line
        for c in contents
        for line in (
            [f"- {f.name}: {f.description}" for f in c.flows]
            + [f"- Rule: {r.description}" for r in c.rules]
        )
    )

    prompt = (
        f"REQUIREMENTS (for reference only — do not expose IDs in output):\n{req_summary[:3000]}\n\n"
        f"GIT CHANGES SUMMARY:\n{git_summary[:2000]}\n\n"
        f"RELEASE VERSION: {version}"
    )
    response = call_llm(prompt, SYSTEM)
    today = date.today().isoformat()
    return f"# PO Progress Report — {version}\n_Generated: {today}_\n\n{response}"
