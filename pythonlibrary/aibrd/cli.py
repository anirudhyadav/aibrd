"""
aibrd CLI — personal repo usage

Commands (core):
  aibrd init   <file>           Parse BRD, generate .aibrd/
  aibrd update <requirement>    Add PO requirement to CONTEXT.md
  aibrd tests  [--module slug]  Generate test cases
  aibrd gaps   <code-file>      Check a file for requirement coverage
  aibrd release <version>       Generate release notes from git diff

Commands (batch 1 — quality & analysis):
  aibrd validate                Validate .aibrd/ structure and cross-references
  aibrd pr-draft                Draft PR description from git diff + requirements
  aibrd change-impact <file>    Analyse impact of a new BRD version

Commands (batch 2 — delivery):
  aibrd sprint  [--module slug] Generate sprint tasks from CONTEXT.md
  aibrd api-contracts [--module] Derive REST API contracts from business flows
  aibrd po-report <version>     Plain-English PO progress report
  aibrd compliance [--fw fw…]   Map requirements to compliance frameworks

Commands (batch 3 — ingestion & traceability):
  aibrd confluence              Ingest a Confluence page as BRD source
  aibrd stale                   Check which requirements have stale code coverage
  aibrd test-linkage            Map requirement IDs to test files
"""

import os
import subprocess
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

app = typer.Typer(help="aibrd — BRD to living specification")
console = Console()


def _aibrd_dir() -> str:
    return str(Path.cwd() / ".aibrd")


def _project_name() -> str:
    return Path.cwd().name


# ── init ──────────────────────────────────────────────────────────────────────

@app.command()
def init(
    file: str = typer.Argument(..., help="Path to BRD file (pdf, docx, md)"),
    force: bool = typer.Option(False, "--force", "-f", help="Overwrite existing .aibrd/"),
):
    """Parse a BRD file and generate the full .aibrd/ living specification."""
    from .parsers import parse_file
    from .chunker import chunk_brd
    from .extractors.module_detector import detect_modules
    from .extractors.actors import extract_actors
    from .extractors.flows import extract_flows
    from .extractors.rules import extract_rules
    from .extractors.acceptance_criteria import extract_acceptance_criteria
    from .generators.context_md import generate_context_md
    from .generators.rtm import generate_rtm
    from .generators.ambiguity_report import detect_ambiguities, format_ambiguity_report
    from .generators.conflict_detector import detect_conflicts, format_conflict_report
    from .generators.test_cases import generate_test_cases
    from .registry import read_registry, write_registry, register_module, next_id, next_shared_id, set_mode
    from .workspace.writer import init_structure, init_module, write_context, write_file, write_tests
    from .models.outputs import BRDContent, Actor, BusinessFlow, BusinessRule, AcceptanceCriteria, FlowStep

    aibrd_dir = _aibrd_dir()

    if os.path.exists(os.path.join(aibrd_dir, "registry.json")) and not force:
        console.print("[yellow].aibrd/ already exists. Use --force to reinitialize.[/yellow]")
        raise typer.Exit(1)

    if not os.path.exists(file):
        console.print(f"[red]File not found: {file}[/red]")
        raise typer.Exit(1)

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as progress:
        task = progress.add_task("Parsing document...", total=None)

        raw_brd = parse_file(file)
        chunks = chunk_brd(raw_brd)
        project_name = _project_name()

        section_count = len([l for l in raw_brd.text.splitlines() if l.startswith("# ") or l.startswith("## ")])
        word_count = len(raw_brd.text.split())
        modular = section_count >= 5 and word_count >= 2000

        registry = read_registry(aibrd_dir)
        registry = set_mode(registry, "modular" if modular else "flat")
        init_structure(aibrd_dir, modular)

        all_contents: list[BRDContent] = []

        if modular:
            progress.update(task, description="Detecting modules...")
            detected_modules = detect_modules(raw_brd.text)

            for mod in detected_modules:
                progress.update(task, description=f"Extracting: {mod.display_name}...")
                registry = register_module(registry, mod)
                init_module(aibrd_dir, mod.slug)

                raw_text = chunks[0].text
                content = BRDContent(module_slug=mod.slug, module_prefix=mod.prefix)

                for a in extract_actors(raw_text):
                    id_, registry = next_shared_id(registry, "ACT")
                    content.actors.append(Actor(id=id_, **a))

                for f in extract_flows(raw_text):
                    id_, registry = next_id(registry, "BF", mod.slug)
                    steps = [FlowStep(**s) for s in f.get("steps", [])]
                    content.flows.append(BusinessFlow(
                        id=id_, name=f["name"], description=f["description"],
                        actors=f.get("actors", []), steps=steps
                    ))

                for r in extract_rules(raw_text):
                    id_, registry = next_id(registry, "BR", mod.slug)
                    content.rules.append(BusinessRule(id=id_, **r))

                for ac in extract_acceptance_criteria(raw_text):
                    id_, registry = next_id(registry, "AC", mod.slug)
                    content.criteria.append(AcceptanceCriteria(id=id_, **ac))

                all_contents.append(content)
        else:
            progress.update(task, description="Extracting requirements...")
            content = BRDContent()
            raw_text = chunks[0].text

            for a in extract_actors(raw_text):
                id_, registry = next_shared_id(registry, "ACT")
                content.actors.append(Actor(id=id_, **a))

            for f in extract_flows(raw_text):
                id_, registry = next_id(registry, "BF")
                steps = [FlowStep(**s) for s in f.get("steps", [])]
                content.flows.append(BusinessFlow(
                    id=id_, name=f["name"], description=f["description"],
                    actors=f.get("actors", []), steps=steps
                ))

            for r in extract_rules(raw_text):
                id_, registry = next_id(registry, "BR")
                content.rules.append(BusinessRule(id=id_, **r))

            for ac in extract_acceptance_criteria(raw_text):
                id_, registry = next_id(registry, "AC")
                content.criteria.append(AcceptanceCriteria(id=id_, **ac))

            all_contents.append(content)

        progress.update(task, description="Generating outputs...")
        for content in all_contents:
            ctx = generate_context_md(content)
            write_context(aibrd_dir, ctx, content.module_slug)
            tc = generate_test_cases(content)
            write_tests(aibrd_dir, tc, content.module_slug)

        rtm = generate_rtm(all_contents, project_name)
        write_file(os.path.join(aibrd_dir, "index.md"), rtm)

        progress.update(task, description="Running quality checks...")
        all_rules = [r for c in all_contents for r in c.rules]
        ambiguities = detect_ambiguities(raw_brd.text[:8000])
        conflicts = detect_conflicts(all_rules)

        write_file(os.path.join(aibrd_dir, "ambiguity-report.md"), format_ambiguity_report(ambiguities))
        write_file(os.path.join(aibrd_dir, "conflict-report.md"), format_conflict_report(conflicts))

        write_registry(aibrd_dir, registry)

    table = Table(title="aibrd Initialization Complete")
    table.add_column("Item", style="cyan")
    table.add_column("Count", justify="right")
    table.add_row("Business Flows", str(sum(len(c.flows) for c in all_contents)))
    table.add_row("Business Rules", str(sum(len(c.rules) for c in all_contents)))
    table.add_row("Actors", str(sum(len(c.actors) for c in all_contents)))
    table.add_row("Acceptance Criteria", str(sum(len(c.criteria) for c in all_contents)))
    table.add_row("Ambiguities", str(len(ambiguities)))
    table.add_row("Conflicts", str(len(conflicts)))
    if modular:
        table.add_row("Modules", str(len(all_contents)))
    console.print(table)
    console.print(f"\n[green]✓ .aibrd/ written. Commit it to git.[/green]")


# ── update ────────────────────────────────────────────────────────────────────

@app.command()
def update(
    requirement: str = typer.Argument(..., help="New requirement text from PO"),
):
    """Add a new PO requirement to CONTEXT.md with auto-assigned IDs."""
    from .extractors.module_detector import match_or_create_module
    from .extractors.flows import extract_flows
    from .extractors.rules import extract_rules
    from .extractors.acceptance_criteria import extract_acceptance_criteria
    from .generators.context_md import changelog_entry
    from .registry import read_registry, write_registry, register_module, next_id
    from .workspace.writer import init_module, append_file
    from .models.module import DetectedModule

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)

    module_slug: str | None = None
    if registry.mode == "modular":
        existing = [
            DetectedModule(display_name=cfg.display_name, slug=slug, prefix=cfg.prefix, confidence="high")
            for slug, cfg in registry.modules.items()
        ]
        mod = match_or_create_module(requirement, existing)
        module_slug = mod.slug
        if module_slug not in registry.modules:
            registry = register_module(registry, mod)
            init_module(aibrd_dir, module_slug)
            console.print(f"[cyan]New module created: {mod.display_name} ({mod.prefix})[/cyan]")

    with Progress(SpinnerColumn(), TextColumn("{task.description}"), console=console) as progress:
        progress.add_task("Extracting requirements...", total=None)
        flows = extract_flows(requirement)
        rules = extract_rules(requirement)
        criteria = extract_acceptance_criteria(requirement)

    new_lines = ["\n"]
    for f in flows:
        id_, registry = next_id(registry, "BF", module_slug)
        new_lines.append(f"\n### {id_}: {f['name']}\n{f['description']}\n")

    for r in rules:
        id_, registry = next_id(registry, "BR", module_slug)
        new_lines.append(f"\n### {id_}\n{r['description']}\n")

    for ac in criteria:
        id_, registry = next_id(registry, "AC", module_slug)
        new_lines.append(
            f"\n### {id_}\n- **Given** {ac['given']}\n- **When** {ac['when']}\n- **Then** {ac['then']}\n"
        )

    ctx_path = (
        os.path.join(aibrd_dir, "modules", module_slug, "CONTEXT.md")
        if module_slug else os.path.join(aibrd_dir, "CONTEXT.md")
    )
    append_file(ctx_path, "\n".join(new_lines))
    write_registry(aibrd_dir, registry)

    console.print(
        f"[green]✓ Added {len(flows)} flows, {len(rules)} rules, {len(criteria)} AC"
        f"{' → ' + module_slug if module_slug else ''}[/green]"
    )


# ── tests ─────────────────────────────────────────────────────────────────────

@app.command()
def tests(
    module: Optional[str] = typer.Option(None, "--module", "-m", help="Module slug (omit for all)"),
):
    """Generate Given/When/Then test cases from CONTEXT.md."""
    from .registry import read_registry
    from .generators.test_cases import generate_test_cases
    from .workspace.writer import write_tests
    from .models.outputs import BRDContent, AcceptanceCriteria, BusinessRule
    import re

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)

    def _parse_context(path: str, slug: str | None = None) -> BRDContent:
        if not os.path.exists(path):
            return BRDContent()
        text = open(path, encoding="utf-8").read()
        criteria, rules = [], []
        prefix = registry.modules[slug].prefix if slug and slug in registry.modules else None

        for m in re.finditer(r"###\s+((?:[A-Z]+-)?AC-\d+)([\s\S]*?)(?=###|\n##|$)", text):
            block = m.group(2)
            given = (re.search(r"\*\*Given\*\*\s+(.+)", block) or re.search(r"Given (.+)", block))
            when  = (re.search(r"\*\*When\*\*\s+(.+)",  block) or re.search(r"When (.+)",  block))
            then  = (re.search(r"\*\*Then\*\*\s+(.+)",  block) or re.search(r"Then (.+)",  block))
            if given and when and then:
                criteria.append(AcceptanceCriteria(
                    id=m.group(1), given=given.group(1), when=when.group(1), then=then.group(1)
                ))
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BR-\d+)\n([^\n]+)", text):
            rules.append(BusinessRule(id=m.group(1), description=m.group(2)))

        return BRDContent(module_slug=slug, module_prefix=prefix, criteria=criteria, rules=rules)

    if registry.mode == "modular":
        slugs = [module] if module else list(registry.modules.keys())
        for slug in slugs:
            ctx_path = os.path.join(aibrd_dir, "modules", slug, "CONTEXT.md")
            content = _parse_context(ctx_path, slug)
            tc = generate_test_cases(content)
            write_tests(aibrd_dir, tc, slug)
            console.print(f"[green]✓ Tests written for module: {slug}[/green]")
    else:
        ctx_path = os.path.join(aibrd_dir, "CONTEXT.md")
        content = _parse_context(ctx_path)
        tc = generate_test_cases(content)
        write_tests(aibrd_dir, tc)
        console.print("[green]✓ test-cases.md written[/green]")


# ── gaps ──────────────────────────────────────────────────────────────────────

@app.command()
def gaps(
    code_file: str = typer.Argument(..., help="Source file to check for coverage"),
    module: Optional[str] = typer.Option(None, "--module", "-m", help="Module slug to load context from"),
):
    """Check a source file against BRD requirements for coverage gaps."""
    from .registry import read_registry
    from .analyzers.gap_detector import detect_gaps, format_gap_report

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)

    if not os.path.exists(code_file):
        console.print(f"[red]File not found: {code_file}[/red]")
        raise typer.Exit(1)

    if registry.mode == "modular":
        ctx_path = os.path.join(aibrd_dir, "modules", module, "CONTEXT.md") if module \
            else os.path.join(aibrd_dir, "index.md")
    else:
        ctx_path = os.path.join(aibrd_dir, "CONTEXT.md")

    context = open(ctx_path, encoding="utf-8").read() if os.path.exists(ctx_path) else ""
    code = open(code_file, encoding="utf-8").read()

    gaps_result = detect_gaps(context, f"// {code_file}\n{code}")
    report = format_gap_report(gaps_result)
    console.print(report)


# ── release ───────────────────────────────────────────────────────────────────

@app.command()
def release(
    version: str = typer.Argument(..., help="Release version, e.g. v2.3.0"),
    git_range: str = typer.Option("HEAD~20..HEAD", "--range", "-r", help="Git commit range to diff"),
):
    """Generate release notes mapping git changes to requirement IDs."""
    from .llm.client import call_llm
    from .registry import read_registry, next_id, write_registry
    from .workspace.writer import write_release
    from datetime import date

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)

    try:
        git_diff = subprocess.check_output(
            ["git", "diff", git_range, "--stat", "--diff-filter=AM"],
            cwd=str(Path.cwd()), text=True
        )
    except subprocess.CalledProcessError:
        console.print("[red]Could not read git diff. Ensure you are in a git repo.[/red]")
        raise typer.Exit(1)

    ctx_path = os.path.join(aibrd_dir, "index.md")
    context = open(ctx_path, encoding="utf-8").read() if os.path.exists(ctx_path) else ""

    SYSTEM = (
        "You are a technical writer. Generate release notes that map code changes to business requirements. "
        "Format as markdown with: ## Summary, ## What Changed (reference requirement IDs BF-XXX, BR-XXX), ## Known Gaps."
    )
    prompt = f"REQUIREMENTS:\n{context[:4000]}\n\nGIT DIFF:\n{git_diff[:4000]}"

    notes = call_llm(prompt, SYSTEM)
    id_, registry = next_id(registry, "RN")
    write_registry(aibrd_dir, registry)

    content = f"# Release Notes — {version}\n_{id_} | Generated: {date.today().isoformat()}_\n\n{notes}"
    write_release(aibrd_dir, version, content)
    console.print(f"[green]✓ Release notes saved to .aibrd/releases/{version}.md[/green]")
    console.print(content)


# ── validate ──────────────────────────────────────────────────────────────────

@app.command()
def validate():
    """Validate .aibrd/ structure, cross-references, and integrity."""
    from .analyzers.validator import validate_aibrd_dir, format_validation_report

    aibrd_dir = _aibrd_dir()
    result = validate_aibrd_dir(aibrd_dir)
    report = format_validation_report(result, aibrd_dir)
    console.print(report)

    if not result.passed:
        raise typer.Exit(1)


# ── pr-draft ──────────────────────────────────────────────────────────────────

@app.command(name="pr-draft")
def pr_draft(
    base: str = typer.Option("main", "--base", "-b", help="Base branch to diff against"),
):
    """Draft a pull request description from git diff + requirement IDs."""
    from .llm.client import call_llm

    aibrd_dir = _aibrd_dir()

    try:
        diff = subprocess.check_output(
            ["git", "diff", f"{base}...HEAD", "--stat"],
            cwd=str(Path.cwd()), text=True
        )
        log = subprocess.check_output(
            ["git", "log", f"{base}...HEAD", "--oneline"],
            cwd=str(Path.cwd()), text=True
        )
    except subprocess.CalledProcessError:
        console.print("[red]Git diff failed. Ensure you are in a git repo with commits.[/red]")
        raise typer.Exit(1)

    ctx_path = os.path.join(aibrd_dir, "index.md")
    if not os.path.exists(ctx_path):
        ctx_path = os.path.join(aibrd_dir, "CONTEXT.md")
    context = open(ctx_path, encoding="utf-8").read() if os.path.exists(ctx_path) else ""

    SYSTEM = """You are a senior engineer writing a pull request description.
Given the git diff and business requirements, write a PR description with:
## What Changed
(bullet list of code changes in plain English)
## Requirements Covered
(list requirement IDs BF-XXX, BR-XXX, AC-XXX that this PR addresses)
## Test Coverage
(note which test files cover the changes)
## Notes for Reviewer
(anything the reviewer should know — trade-offs, TODOs, edge cases)"""

    prompt = f"REQUIREMENTS:\n{context[:3000]}\n\nCOMMITS:\n{log[:1000]}\n\nCHANGED FILES:\n{diff[:2000]}"
    description = call_llm(prompt, SYSTEM)
    console.print(description)


# ── change-impact ─────────────────────────────────────────────────────────────

@app.command(name="change-impact")
def change_impact(
    new_brd: str = typer.Argument(..., help="Path to updated BRD file"),
):
    """Analyse the impact of a new BRD version against the existing specification."""
    from .parsers import parse_file
    from .analyzers.change_impact import analyze_change_impact, format_impact_report
    from .workspace.writer import write_file

    aibrd_dir = _aibrd_dir()
    ctx_path = os.path.join(aibrd_dir, "CONTEXT.md")
    old_context = open(ctx_path, encoding="utf-8").read() if os.path.exists(ctx_path) else ""

    if not os.path.exists(new_brd):
        console.print(f"[red]File not found: {new_brd}[/red]")
        raise typer.Exit(1)

    raw = parse_file(new_brd)

    with Progress(SpinnerColumn(), TextColumn("Analysing change impact..."), console=console) as _:
        pass

    impacts = analyze_change_impact(old_context, raw.text)
    report = format_impact_report(impacts)
    write_file(os.path.join(aibrd_dir, "change-impact-report.md"), report)
    console.print(report)
    console.print(f"[green]✓ Saved to .aibrd/change-impact-report.md[/green]")


# ── sprint ────────────────────────────────────────────────────────────────────

@app.command()
def sprint(
    module: Optional[str] = typer.Option(None, "--module", "-m", help="Module slug (omit for all)"),
    github_issues: bool = typer.Option(False, "--github-issues", help="Output as GitHub Issues JSON"),
):
    """Generate sprint tasks from CONTEXT.md requirement IDs."""
    from .registry import read_registry
    from .generators.sprint_feed import generate_sprint_feed, format_sprint_feed, format_sprint_feed_as_github_issues
    from .workspace.writer import write_file
    from .models.outputs import BRDContent, BusinessFlow, BusinessRule, AcceptanceCriteria
    import re

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)
    project_name = _project_name()

    def _parse(path: str, slug: str | None = None) -> BRDContent:
        if not os.path.exists(path):
            return BRDContent()
        text = open(path, encoding="utf-8").read()
        flows, rules, criteria = [], [], []
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)", text):
            flows.append(BusinessFlow(id=m.group(1), name=m.group(2), description=m.group(2)))
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BR-\d+)\n([^\n]+)", text):
            rules.append(BusinessRule(id=m.group(1), description=m.group(2)))
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?AC-\d+)([\s\S]*?)(?=###|\n##|$)", text):
            block = m.group(2)
            given = (re.search(r"\*\*Given\*\*\s+(.+)", block) or re.search(r"Given (.+)", block))
            when  = (re.search(r"\*\*When\*\*\s+(.+)",  block) or re.search(r"When (.+)",  block))
            then  = (re.search(r"\*\*Then\*\*\s+(.+)",  block) or re.search(r"Then (.+)",  block))
            criteria.append(AcceptanceCriteria(
                id=m.group(1),
                given=given.group(1) if given else "",
                when=when.group(1) if when else "",
                then=then.group(1) if then else "",
            ))
        return BRDContent(module_slug=slug, flows=flows, rules=rules, criteria=criteria)

    slugs_to_run = (
        [module] if module
        else (list(registry.modules.keys()) if registry.mode == "modular" else [None])
    )

    all_tasks = []
    for slug in slugs_to_run:
        ctx_path = (
            os.path.join(aibrd_dir, "modules", slug, "CONTEXT.md") if slug
            else os.path.join(aibrd_dir, "CONTEXT.md")
        )
        content = _parse(ctx_path, slug)
        tasks = generate_sprint_feed(content)
        all_tasks.extend(tasks)

    if github_issues:
        output = format_sprint_feed_as_github_issues(all_tasks)
    else:
        output = format_sprint_feed(all_tasks, project_name)
        write_file(os.path.join(aibrd_dir, "sprint-feed.md"), output)
        console.print(f"[green]✓ {len(all_tasks)} tasks saved to .aibrd/sprint-feed.md[/green]")

    console.print(output)


# ── api-contracts ─────────────────────────────────────────────────────────────

@app.command(name="api-contracts")
def api_contracts(
    module: Optional[str] = typer.Option(None, "--module", "-m", help="Module slug"),
    fmt: str = typer.Option("markdown", "--format", "-f", help="Output format: markdown | openapi"),
):
    """Derive REST API contracts from business flows in CONTEXT.md."""
    from .registry import read_registry
    from .generators.api_contracts import (
        derive_api_contracts, format_api_contracts_as_markdown, format_api_contracts_as_openapi
    )
    from .workspace.writer import write_file
    from .models.outputs import BRDContent, BusinessFlow, FlowStep
    import re

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)
    project_name = _project_name()

    def _parse(path: str, slug: str | None = None) -> BRDContent:
        if not os.path.exists(path):
            return BRDContent()
        text = open(path, encoding="utf-8").read()
        flows = []
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)", text):
            flows.append(BusinessFlow(id=m.group(1), name=m.group(2), description=m.group(2)))
        return BRDContent(module_slug=slug, flows=flows)

    slug = module
    if not slug and registry.mode == "modular":
        slugs = list(registry.modules.keys())
        slug = slugs[0] if len(slugs) == 1 else None

    ctx_path = (
        os.path.join(aibrd_dir, "modules", slug, "CONTEXT.md") if slug
        else os.path.join(aibrd_dir, "CONTEXT.md")
    )
    content = _parse(ctx_path, slug)
    endpoints = derive_api_contracts(content)

    if fmt == "openapi":
        output = format_api_contracts_as_openapi(endpoints, project_name, slug)
        filename = f"{slug}-openapi.yaml" if slug else "openapi.yaml"
    else:
        output = format_api_contracts_as_markdown(endpoints)
        filename = f"{slug}-api-contracts.md" if slug else "api-contracts.md"

    write_file(os.path.join(aibrd_dir, filename), output)
    console.print(output)
    console.print(f"[green]✓ {len(endpoints)} endpoints saved to .aibrd/{filename}[/green]")


# ── po-report ─────────────────────────────────────────────────────────────────

@app.command(name="po-report")
def po_report(
    version: str = typer.Argument(..., help="Release version, e.g. v1.2.0"),
    git_range: str = typer.Option("HEAD~20..HEAD", "--range", "-r", help="Git commit range"),
):
    """Generate a plain-English PO progress report (no requirement IDs visible)."""
    from .registry import read_registry
    from .generators.po_report import generate_po_report, get_git_summary
    from .workspace.writer import write_file
    from .models.outputs import BRDContent, BusinessFlow, BusinessRule
    import re

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)
    workspace_root = str(Path.cwd())

    def _parse(path: str, slug: str | None = None) -> BRDContent:
        if not os.path.exists(path):
            return BRDContent()
        text = open(path, encoding="utf-8").read()
        flows, rules = [], []
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)", text):
            flows.append(BusinessFlow(id=m.group(1), name=m.group(2), description=m.group(2)))
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BR-\d+)\n([^\n]+)", text):
            rules.append(BusinessRule(id=m.group(1), description=m.group(2)))
        return BRDContent(module_slug=slug, flows=flows, rules=rules)

    slugs = list(registry.modules.keys()) if registry.mode == "modular" else [None]
    contents = []
    for slug in slugs:
        ctx_path = (
            os.path.join(aibrd_dir, "modules", slug, "CONTEXT.md") if slug
            else os.path.join(aibrd_dir, "CONTEXT.md")
        )
        contents.append(_parse(ctx_path, slug))

    git_summary = get_git_summary(workspace_root, git_range)
    report = generate_po_report(contents, git_summary, version)

    filename = f"po-report-{version.replace('/', '-')}.md"
    write_file(os.path.join(aibrd_dir, "releases", filename), report)
    console.print(report)
    console.print(f"[green]✓ Saved to .aibrd/releases/{filename}[/green]")


# ── compliance ────────────────────────────────────────────────────────────────

@app.command()
def compliance(
    frameworks: list[str] = typer.Option(
        ["GDPR", "WCAG"],
        "--framework", "--fw", "-f",
        help="Frameworks to check (can repeat). Options: GDPR WCAG HIPAA SOX PCI-DSS ISO27001"
    ),
):
    """Map requirements to compliance frameworks (GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO27001)."""
    from .registry import read_registry
    from .generators.compliance_mapper import map_compliance, format_compliance_map, ALL_FRAMEWORKS
    from .workspace.writer import write_file
    from .models.outputs import BRDContent, BusinessFlow, BusinessRule
    import re

    aibrd_dir = _aibrd_dir()
    registry = read_registry(aibrd_dir)

    # validate frameworks
    valid = [f for f in frameworks if f in ALL_FRAMEWORKS]
    if not valid:
        console.print(f"[red]No valid frameworks. Choose from: {', '.join(ALL_FRAMEWORKS)}[/red]")
        raise typer.Exit(1)

    def _parse(path: str, slug: str | None = None) -> BRDContent:
        if not os.path.exists(path):
            return BRDContent()
        text = open(path, encoding="utf-8").read()
        flows, rules = [], []
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)", text):
            flows.append(BusinessFlow(id=m.group(1), name=m.group(2), description=m.group(2)))
        for m in re.finditer(r"###\s+((?:[A-Z]+-)?BR-\d+)\n([^\n]+)", text):
            rules.append(BusinessRule(id=m.group(1), description=m.group(2)))
        return BRDContent(module_slug=slug, flows=flows, rules=rules)

    slugs = list(registry.modules.keys()) if registry.mode == "modular" else [None]
    contents = []
    for slug in slugs:
        ctx_path = (
            os.path.join(aibrd_dir, "modules", slug, "CONTEXT.md") if slug
            else os.path.join(aibrd_dir, "CONTEXT.md")
        )
        contents.append(_parse(ctx_path, slug))

    tags = map_compliance(contents, valid)
    report = format_compliance_map(tags)
    write_file(os.path.join(aibrd_dir, "compliance-map.md"), report)
    console.print(report)
    console.print(f"[green]✓ {len(tags)} tags saved to .aibrd/compliance-map.md[/green]")


# ── confluence ────────────────────────────────────────────────────────────────

@app.command()
def confluence(
    base_url: str = typer.Option(..., "--url", help="Confluence base URL, e.g. https://org.atlassian.net"),
    space_key: str = typer.Option(..., "--space", help="Confluence space key, e.g. ENG"),
    page_title: str = typer.Option(..., "--page", help="Page title to ingest"),
    token: str = typer.Option(..., "--token", envvar="CONFLUENCE_TOKEN", help="API token or PAT"),
    email: Optional[str] = typer.Option(None, "--email", help="Email for Atlassian Cloud (omit for Server/DC)"),
    force: bool = typer.Option(False, "--force", "-f", help="Reinitialize if .aibrd/ already exists"),
):
    """Ingest a Confluence page directly as the BRD source."""
    from .parsers.confluence import ConfluenceConfig, ingest_confluence_page

    cfg = ConfluenceConfig(
        base_url=base_url, space_key=space_key, page_title=page_title,
        token=token, email=email
    )
    console.print(f"[cyan]Fetching Confluence page: {page_title}…[/cyan]")
    try:
        raw_brd = ingest_confluence_page(cfg)
    except Exception as e:
        console.print(f"[red]Confluence fetch failed: {e}[/red]")
        raise typer.Exit(1)

    # Write to a temp file and call init logic
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".md", mode="w", delete=False, encoding="utf-8") as tmp:
        tmp.write(raw_brd.text)
        tmp_path = tmp.name

    console.print(f"[cyan]Fetched {len(raw_brd.text)} chars. Running init…[/cyan]")
    # delegate to init
    from typer.testing import CliRunner
    runner = CliRunner()
    args = [tmp_path]
    if force:
        args.append("--force")
    result = runner.invoke(app, ["init"] + args)
    console.print(result.output)
    os.unlink(tmp_path)


# ── stale ─────────────────────────────────────────────────────────────────────

@app.command()
def stale(
    module: Optional[str] = typer.Option(None, "--module", "-m", help="Module slug (omit for all)"),
):
    """Check which requirements have gone stale (no code activity in >30 days)."""
    from .analyzers.stale_detector import detect_stale_requirements, build_staleness_report, format_staleness_report
    from .registry import read_registry
    from .workspace.writer import write_file

    aibrd_dir = _aibrd_dir()
    workspace_root = str(Path.cwd())
    registry = read_registry(aibrd_dir)

    slugs = (
        [module] if module
        else (list(registry.modules.keys()) if registry.mode == "modular" else [None])
    )

    all_items = []
    for slug in slugs:
        all_items.extend(detect_stale_requirements(aibrd_dir, workspace_root, slug))

    from .analyzers.stale_detector import build_staleness_report
    report = build_staleness_report(all_items)
    formatted = format_staleness_report(report, module)
    write_file(os.path.join(aibrd_dir, "staleness-report.md"), formatted)
    console.print(formatted)

    stale_count = report.stale_count
    if stale_count:
        console.print(f"[red]⚠ {stale_count} stale requirement(s) found.[/red]")
        raise typer.Exit(1)
    else:
        console.print("[green]✓ All requirements are up to date.[/green]")


# ── test-linkage ──────────────────────────────────────────────────────────────

@app.command(name="test-linkage")
def test_linkage(
    module: Optional[str] = typer.Option(None, "--module", "-m", help="Module slug (omit for all)"),
):
    """Map requirement IDs to actual test files in the workspace."""
    from .analyzers.test_linkage import link_test_files, build_test_linkage_report, format_test_linkage_report
    from .registry import read_registry
    from .workspace.writer import write_file

    aibrd_dir = _aibrd_dir()
    workspace_root = str(Path.cwd())
    registry = read_registry(aibrd_dir)

    slugs = (
        [module] if module
        else (list(registry.modules.keys()) if registry.mode == "modular" else [None])
    )

    all_links = []
    for slug in slugs:
        all_links.extend(link_test_files(aibrd_dir, workspace_root, slug))

    report = build_test_linkage_report(all_links)
    formatted = format_test_linkage_report(report, module)
    write_file(os.path.join(aibrd_dir, "test-linkage-report.md"), formatted)
    console.print(formatted)

    total = len(all_links)
    pct = round(report.covered_count / total * 100) if total else 0
    console.print(f"\n[{'green' if pct >= 80 else 'yellow'}]{pct}% requirements covered by tests.[/{'green' if pct >= 80 else 'yellow'}]")


if __name__ == "__main__":
    app()
