"""
CONTEXT.md validator — pure logic, no LLM needed.
Checks for broken cross-references, duplicate IDs, missing sections.
"""

import json
import os
import re
from dataclasses import dataclass, field
from datetime import date
from typing import Literal


@dataclass
class ValidationIssue:
    severity: Literal["error", "warning"]
    file: str
    message: str
    id: str = ""


@dataclass
class ValidationResult:
    issues: list[ValidationIssue] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(i.severity != "error" for i in self.issues)

    @property
    def errors(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == "error"]

    @property
    def warnings(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == "warning"]


_HEADING_ID = re.compile(r"^###\s+([A-Z]+-?(?:BF|BR|AC|FT|TC|RN)-\d+)", re.MULTILINE)
_CROSS_REF  = re.compile(r"_(?:Rules|Flows|AC|Flow):\s*([^\n_]+)")


def _read(path: str) -> str:
    return open(path, encoding="utf-8").read() if os.path.exists(path) else ""


def validate_aibrd_dir(aibrd_dir: str) -> ValidationResult:
    result = ValidationResult()

    # 1. registry.json must exist
    registry_path = os.path.join(aibrd_dir, "registry.json")
    if not os.path.exists(registry_path):
        result.issues.append(ValidationIssue(
            severity="error", file="registry.json",
            message="registry.json not found. Run `aibrd init` first."
        ))
        return result

    try:
        registry = json.loads(open(registry_path, encoding="utf-8").read())
    except json.JSONDecodeError:
        result.issues.append(ValidationIssue(
            severity="error", file="registry.json",
            message="registry.json is malformed JSON."
        ))
        return result

    mode = registry.get("mode", "flat")

    # 2. collect CONTEXT.md files
    context_files: list[str] = []
    if mode == "flat":
        ctx = os.path.join(aibrd_dir, "CONTEXT.md")
        if os.path.exists(ctx):
            context_files.append(ctx)
        else:
            result.issues.append(ValidationIssue(
                severity="error", file="CONTEXT.md",
                message="CONTEXT.md not found in flat mode."
            ))
    else:
        modules_dir = os.path.join(aibrd_dir, "modules")
        if os.path.exists(modules_dir):
            for slug in os.listdir(modules_dir):
                ctx = os.path.join(modules_dir, slug, "CONTEXT.md")
                if os.path.exists(ctx):
                    context_files.append(ctx)
                else:
                    result.issues.append(ValidationIssue(
                        severity="warning", file=f"modules/{slug}/CONTEXT.md",
                        message=f'Module "{slug}" has no CONTEXT.md.'
                    ))

    # 3. collect all defined IDs
    defined_ids: set[str] = set()
    for f in context_files:
        for m in _HEADING_ID.finditer(_read(f)):
            defined_ids.add(m.group(1))

    # 4. validate each CONTEXT.md
    for f in context_files:
        text = _read(f)
        short = f.replace(aibrd_dir + os.sep, "")

        # broken cross-references
        for ref_match in _CROSS_REF.finditer(text):
            for ref_id in [r.strip() for r in ref_match.group(1).split(",") if r.strip()]:
                if ref_id and ref_id not in defined_ids:
                    result.issues.append(ValidationIssue(
                        severity="warning", file=short,
                        message=f'Cross-reference to "{ref_id}" not found in any CONTEXT.md.',
                        id=ref_id
                    ))

        # duplicate IDs within file
        seen: set[str] = set()
        for m in _HEADING_ID.finditer(text):
            id_ = m.group(1)
            if id_ in seen:
                result.issues.append(ValidationIssue(
                    severity="error", file=short,
                    message=f'Duplicate ID "{id_}" found.', id=id_
                ))
            seen.add(id_)

        # missing changelog
        if "## Changelog" not in text:
            result.issues.append(ValidationIssue(
                severity="warning", file=short,
                message="Missing ## Changelog section."
            ))

    # 5. modular: index.md must exist
    if mode == "modular" and not os.path.exists(os.path.join(aibrd_dir, "index.md")):
        result.issues.append(ValidationIssue(
            severity="warning", file="index.md",
            message="index.md (RTM) not found. Run `aibrd init` to regenerate."
        ))

    return result


def format_validation_report(result: ValidationResult, aibrd_dir: str) -> str:
    today = date.today().isoformat()
    lines = ["# Validation Report", f"_Generated: {today}_", f"_Directory: {aibrd_dir}_", ""]

    if result.passed and not result.issues:
        lines.append("✅ All checks passed. No issues found.")
        return "\n".join(lines)

    lines.append(f"**{len(result.errors)} error(s) · {len(result.warnings)} warning(s)**")
    lines.append("")

    if result.errors:
        lines += ["## ❌ Errors", ""]
        for e in result.errors:
            lines.append(f"- **{e.file}**: {e.message}")
        lines.append("")

    if result.warnings:
        lines += ["## ⚠️ Warnings", ""]
        for w in result.warnings:
            lines.append(f"- **{w.file}**: {w.message}")
        lines.append("")

    return "\n".join(lines)
