"""
aibrd CLI — personal repo usage

Commands:
  aibrd init   <file>           Parse BRD, generate .aibrd/
  aibrd update <requirement>    Add PO requirement to CONTEXT.md
  aibrd tests  [--module slug]  Generate test cases
  aibrd gaps   <code-file>      Check a file for requirement coverage
  aibrd release <version>       Generate release notes from git diff
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
    cwd = Path.cwd()
    return str(cwd / ".aibrd")


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

        # detect mode
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

    # summary table
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

    with Progress(SpinnerColumn(), TextColumn("Analysing coverage..."), console=console) as _:
        pass

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

    with Progress(SpinnerColumn(), TextColumn("Generating release notes..."), console=console) as _:
        pass

    notes = call_llm(prompt, SYSTEM)
    id_, registry = next_id(registry, "RN")
    write_registry(aibrd_dir, registry)

    content = f"# Release Notes — {version}\n_{id_} | Generated: {date.today().isoformat()}_\n\n{notes}"
    write_release(aibrd_dir, version, content)
    console.print(f"[green]✓ Release notes saved to .aibrd/releases/{version}.md[/green]")
    console.print(content)


if __name__ == "__main__":
    app()
