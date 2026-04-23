"""Test linkage analyzer — maps requirement IDs to actual test files in the workspace."""

from __future__ import annotations
import re
import subprocess
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path


TEST_PATTERNS = re.compile(
    r"\.(test|spec)\.(ts|tsx|js|jsx|py|java)$|Test\.(java|py)$|_test\.(py|go)$"
)


@dataclass
class TestLink:
    requirement_id: str
    requirement_title: str
    test_files: list[str] = field(default_factory=list)
    test_count: int = 0
    covered: bool = False


@dataclass
class TestLinkageReport:
    covered_count: int
    uncovered_count: int
    total_tests: int
    links: list[TestLink] = field(default_factory=list)


def _git_ls_files(workspace_root: str) -> list[str]:
    try:
        out = subprocess.check_output(
            ["git", "-C", workspace_root, "ls-files"],
            encoding="utf-8", stderr=subprocess.DEVNULL,
        )
        return [f for f in out.splitlines() if TEST_PATTERNS.search(f)]
    except Exception:
        return []


def link_test_files(
    aibrd_dir: str,
    workspace_root: str,
    slug: str | None = None,
) -> list[TestLink]:
    ctx_path = (
        Path(aibrd_dir) / "modules" / slug / "CONTEXT.md"
        if slug
        else Path(aibrd_dir) / "CONTEXT.md"
    )
    if not ctx_path.exists():
        return []

    text = ctx_path.read_text(encoding="utf-8")
    test_files = _git_ls_files(workspace_root)
    ws = Path(workspace_root)
    links: list[TestLink] = []

    for m in re.finditer(r"###\s+((?:[A-Z]+-)?(?:BF|AC|TC)-\d+):\s*(.+)", text):
        req_id, title = m.group(1), m.group(2).strip()
        matched: list[str] = []
        for tf in test_files:
            try:
                src = (ws / tf).read_text(encoding="utf-8", errors="ignore")
                if req_id in src:
                    matched.append(tf)
            except Exception:
                pass
        links.append(TestLink(
            requirement_id=req_id,
            requirement_title=title,
            test_files=matched,
            test_count=len(matched),
            covered=len(matched) > 0,
        ))

    return links


def build_test_linkage_report(links: list[TestLink]) -> TestLinkageReport:
    return TestLinkageReport(
        covered_count=sum(1 for l in links if l.covered),
        uncovered_count=sum(1 for l in links if not l.covered),
        total_tests=sum(l.test_count for l in links),
        links=links,
    )


def format_test_linkage_report(report: TestLinkageReport, slug: str | None = None) -> str:
    today = date.today().isoformat()
    scope = f" — {slug}" if slug else ""
    total = len(report.links)
    pct = round(report.covered_count / total * 100) if total else 0

    lines = [
        f"# Test Linkage Report{scope}",
        f"_Generated: {today}_",
        "",
        f"> **{pct}% requirements covered** · {report.covered_count} covered · {report.uncovered_count} uncovered · {report.total_tests} test file references",
        "",
    ]

    uncovered = [l for l in report.links if not l.covered]
    covered = [l for l in report.links if l.covered]

    if uncovered:
        lines += ["## ❌ Not Covered by Tests", ""]
        lines.append("| Requirement | Title |")
        lines.append("|---|---|")
        for l in uncovered:
            lines.append(f"| **{l.requirement_id}** | {l.requirement_title[:60]} |")
        lines.append("")

    if covered:
        lines += ["## ✅ Covered", ""]
        lines.append("| Requirement | Title | Test Files |")
        lines.append("|---|---|---|")
        for l in covered:
            files = ", ".join(l.test_files[:2])
            if len(l.test_files) > 2:
                files += f" +{len(l.test_files) - 2}"
            lines.append(f"| **{l.requirement_id}** | {l.requirement_title[:50]} | {files} |")
        lines.append("")

    if uncovered:
        lines += [
            "## Recommended Actions",
            "",
            "- Add `# aibrd: <REQ-ID>` comments in test files to improve traceability.",
            "- Run `aibrd generate-tests` to scaffold test cases for uncovered requirements.",
        ]

    return "\n".join(lines)
