# aibrd Python Library — Playbook

**Practical guide for personal repos, explorers, and automation pipelines.**

This playbook covers the **Python CLI and importable library**. For the VS Code Extension (org teams on GitHub Enterprise + Copilot), see [PLAYBOOK.md](../PLAYBOOK.md).

---

## Which Tool Should I Use?

| Situation | Use |
|---|---|
| Personal repo, any machine | **This playbook** — Python Library |
| Scripting, CI automation, pre-commit hooks | **This playbook** — Python Library |
| Exploring aibrd without VS Code | **This playbook** — Python Library |
| Org team on GitHub Enterprise with Copilot | [VS Code Extension Playbook](../PLAYBOOK.md) |

Both tools produce the same `.aibrd/` output format — fully compatible on the same repo.

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [LLM Provider Configuration](#2-llm-provider-configuration)
3. [Initialize a Project](#3-initialize-a-project)
4. [Add a New Requirement](#4-add-a-new-requirement)
5. [Generate Test Cases](#5-generate-test-cases)
6. [Check Coverage Gaps](#6-check-coverage-gaps)
7. [Generate Release Notes](#7-generate-release-notes)
8. [Quality & Analysis Commands](#8-quality--analysis-commands)
9. [Delivery Tool Commands](#9-delivery-tool-commands)
10. [Ingestion & Traceability Commands](#10-ingestion--traceability-commands)
11. [Use as a Python Library](#11-use-as-a-python-library)
12. [Understanding the .aibrd/ Folder](#12-understanding-the-aibrd-folder)
13. [Stable ID Reference](#13-stable-id-reference)
14. [Environment Variables](#14-environment-variables)
15. [Troubleshooting](#15-troubleshooting)
16. [Quick Reference Card](#16-quick-reference-card)

---

## 1. Prerequisites & Setup

### Requirements

- Python 3.10+
- pip
- A git repository
- One LLM provider (see [Section 2](#2-llm-provider-configuration))

### Install

```bash
git clone https://github.com/anirudhyadav/aibrd.git
cd aibrd/pythonlibrary
pip install -e .
```

Or install dependencies directly:
```bash
pip install -r requirements.txt
```

Verify installation:
```bash
aibrd --help
```

Expected output:
```
Usage: aibrd [OPTIONS] COMMAND [ARGS]...

  aibrd — BRD to living specification

Commands:
  init            Parse a BRD file and generate .aibrd/
  update          Add a new PO requirement to CONTEXT.md
  tests           Generate Given/When/Then test cases
  gaps            Check a source file for coverage gaps
  release         Generate release notes from git diff
  validate        Validate .aibrd/ structure and integrity
  pr-draft        Draft a PR description from git diff
  change-impact   Analyse impact of a new BRD version
  sprint          Generate sprint tasks from CONTEXT.md
  api-contracts   Derive REST API contracts from business flows
  po-report       Plain-English PO progress report
  compliance      Map requirements to compliance frameworks
  confluence      Ingest a Confluence page as BRD source
  stale           Check requirement staleness against git history
  test-linkage    Map requirement IDs to test files
```

---

## 2. LLM Provider Configuration

aibrd auto-detects your LLM provider from environment variables. Set **one** of the following:

### Option A — Anthropic Claude (Recommended)

Best quality for complex BRDs with ambiguous language.

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get a key at: [console.anthropic.com](https://console.anthropic.com)

Default model: `claude-sonnet-4-5`

### Option B — GitHub Models (Free)

No extra account needed. Uses your existing GitHub account.

```bash
export GITHUB_TOKEN=ghp_...
```

Get a token at: GitHub → Settings → Developer Settings → Personal Access Tokens

Default model: `gpt-4o-mini`

### Option C — OpenAI

```bash
export OPENAI_API_KEY=sk-proj-...
```

Default model: `gpt-4o`

### Override the Model

```bash
export AIBRD_MODEL=claude-opus-4-7      # best for complex/ambiguous BRDs
export AIBRD_MODEL=claude-sonnet-4-5    # good default
export AIBRD_MODEL=gpt-4o               # OpenAI alternative
export AIBRD_MODEL=gpt-4o-mini          # faster / cheaper
```

### Provider Priority

If multiple keys are set, priority is:
```
ANTHROPIC_API_KEY → GITHUB_TOKEN → OPENAI_API_KEY
```

### Persist with .env (optional)

Create a `.env` file in your project root (add to `.gitignore`):
```bash
ANTHROPIC_API_KEY=sk-ant-...
AIBRD_MODEL=claude-sonnet-4-5
AIBRD_CHUNK_TOKENS=6000
```

Load it before running:
```bash
source .env && aibrd init ./brd.pdf
```

---

## 3. Initialize a Project

This is a one-time command per project. Run it from your repo root.

### Command

```bash
aibrd init <file>
```

### Supported Formats

| Format | Notes |
|---|---|
| `.pdf` | Best for finalized Confluence/SharePoint exports |
| `.docx` / `.doc` | Best for editable Word documents |
| `.md` | If already in Markdown |
| Confluence page | Use `aibrd confluence` command directly |

### Examples

```bash
aibrd init ./docs/payment-service-brd.pdf
aibrd init ./docs/requirements.docx
aibrd init ./specs/feature-spec.md
aibrd init ./brd-v2.pdf --force   # reinitialize with new BRD version
```

### What Happens

```
Parse BRD file
    ↓
Detect flat (small) or modular (large) project
    ↓  [modular only]
Detect business domains → auto-generate module names + prefixes
    ↓
Extract: actors · business flows · business rules · acceptance criteria
    ↓
Assign stable IDs: PAY-BF-001, AUTH-BR-003, ACT-001 ...
    ↓
Generate:
  CONTEXT.md            ← structured living spec
  tests/test-cases.md   ← Given/When/Then test cases
  index.md              ← traceability matrix
  ambiguity-report.md   ← vague terms flagged
  conflict-report.md    ← contradicting rules flagged
```

### Terminal Output

```
┌─────────────────────────────────────────────┐
│        aibrd Initialization Complete         │
├──────────────────────────┬──────────────────┤
│ Item                     │            Count │
├──────────────────────────┼──────────────────┤
│ Business Flows           │               12 │
│ Business Rules           │               24 │
│ Actors                   │                5 │
│ Acceptance Criteria      │               18 │
│ Ambiguities              │                3 │
│ Conflicts                │                1 │
│ Modules                  │                3 │
└──────────────────────────┴──────────────────┘

✓ .aibrd/ written. Commit it to git.
```

### Commit the Output

```bash
git add .aibrd/
git commit -m "feat: initialize aibrd living spec from BRD v1.0"
```

---

## 4. Add a New Requirement

### Command

```bash
aibrd update "<requirement text>"
```

### Examples

```bash
aibrd update "Users must be able to reset password via SMS OTP. OTP expires in 60 seconds. Maximum 3 failed attempts before 15-minute lockout."

aibrd update "The system must send a confirmation email within 2 minutes of a successful payment."

aibrd update "Admin users can export transaction reports as CSV or PDF."
```

### What Happens

1. LLM determines which module the requirement belongs to (modular projects)
2. Creates a new module automatically if it's a new domain
3. Extracts flows, rules, and AC from the text
4. Assigns new stable IDs (continuing from the registry)
5. Appends to the correct `CONTEXT.md`
6. Updates `registry.json`

### Terminal Output

```
✓ Added 1 flows, 2 rules, 1 AC → auth
```

### Commit the Update

```bash
git add .aibrd/
git commit -m "spec(auth): add SMS OTP password reset — AUTH-BF-004"
```

---

## 5. Generate Test Cases

### Command

```bash
aibrd tests                       # all modules (or flat)
aibrd tests --module payments     # specific module only
aibrd tests --module auth
```

### What Gets Generated

| Source | Test Case Type |
|---|---|
| Each `AC-XXX` (Acceptance Criteria) | Functional Given/When/Then scenario |
| Each `BR-XXX` (Business Rule) | Boundary condition test |

### Output Location

```
.aibrd/modules/<slug>/tests/test-cases.md   # modular
.aibrd/tests/test-cases.md                  # flat
```

### Output Format

```markdown
## PAY-TC-001
_Traces: PAY-AC-001, PAY-BF-001_

```gherkin
Scenario: Customer submits valid payment
  Given a customer has items in cart
  When they submit a valid payment method
  Then confirmation is shown within 5 seconds
```

## PAY-TC-boundary-001
_Traces: PAY-BR-001_

```gherkin
Scenario: Verify rule — Payment must complete within 30 seconds
  Given the system is operational
  When a payment is initiated
  Then the rule is enforced: Payment must complete within 30 seconds
```
```

Every `TC-XXX` ID traces back to an `AC-XXX` or `BR-XXX` — so a failing test always points to a specific requirement.

---

## 6. Check Coverage Gaps

### Command

```bash
aibrd gaps <source-file>
aibrd gaps src/payments/checkout.py
aibrd gaps src/auth/password_reset.py --module auth
aibrd gaps src/notifications/email.py --module notifications
```

### Output

```
# Gap Report
_Generated: 2026-04-23_

**Summary:** 8 covered · 2 partial · 3 missing

## ❌ Missing Coverage

### PAY-BF-004: Refund approval workflow
No code found handling the multi-step refund approval process.

## ⚠️ Partial Coverage

### AUTH-BR-007: OTP expiry enforcement
OTP expiry logic exists but the 60-second window is hardcoded, not configurable.
```

### Use in Pre-commit Hook

Add to `.pre-commit-config.yaml`:
```yaml
- repo: local
  hooks:
    - id: aibrd-gaps
      name: aibrd coverage check
      entry: aibrd gaps
      args: [src/]
      language: system
      types: [python]
```

---

## 7. Generate Release Notes

### Command

```bash
aibrd release <version>
aibrd release v2.3.0
aibrd release v2.3.0 --range main...release/v2.3
aibrd release v2.3.0 --range HEAD~20..HEAD
```

### Output Format

```markdown
# Release Notes — v2.3.0
_RN-004 | Generated: 2026-04-23_

## Summary
- Payment refund flow (PAY-BF-003) fully implemented
- SMS OTP password reset (AUTH-BF-004) shipped

## What Changed

### PAY-BF-003: Refund Initiation
Customers can now initiate refunds within 30 days.
Satisfies: PAY-BR-005, PAY-BR-006, PAY-AC-008

## Known Gaps
- NOTIF-BF-002: Email notification on refund — not yet implemented
```

Saved to: `.aibrd/releases/<version>.md`

---

## 8. Quality & Analysis Commands

### Validate .aibrd/ Integrity

```bash
aibrd validate
```

Pure logic — no LLM call, instant response. Checks:
- `registry.json` exists and is readable
- `CONTEXT.md` or module files exist for every registered module
- All ID cross-references resolve to real IDs
- No duplicate IDs across modules
- Changelog section present in every CONTEXT.md

Exit code `0` = pass, `1` = fail. Safe to use in CI:

```yaml
- name: Validate aibrd spec
  run: aibrd validate
```

### Draft a Pull Request Description

```bash
aibrd pr-draft               # diffs against main
aibrd pr-draft --base develop
```

Reads git diff against the base branch, loads the RTM, and generates a PR description with:
- **What Changed** — plain English bullet list
- **Requirements Covered** — traced BF-XXX, BR-XXX, AC-XXX IDs
- **Test Coverage** — which test files cover the changes
- **Notes for Reviewer** — trade-offs and edge cases

Prints to stdout — pipe or copy into your PR.

### Analyse Change Impact

```bash
aibrd change-impact ./brd-v2.pdf
```

Compares the new BRD file against the existing CONTEXT.md and produces `.aibrd/change-impact-report.md` with:
- Requirements that have changed scope
- Requirements that appear to have been removed
- Entirely new requirements not yet registered

Run this before `aibrd init --force` to understand the full impact of a BRD revision.

---

## 9. Delivery Tool Commands

### Generate Sprint Tasks

```bash
aibrd sprint                          # all modules
aibrd sprint --module payments        # specific module
aibrd sprint --github-issues          # output as GitHub Issues JSON
```

Generates `TASK-001` format developer tasks from CONTEXT.md with:
- Story point estimates (Fibonacci)
- Priority (high / medium / low)
- Requirement ID tracing
- Acceptance criteria checklist

Output saved to `.aibrd/sprint-feed.md`.

**GitHub Issues integration:**

```bash
# Output one JSON object per line, ready for the GitHub Issues API
aibrd sprint --github-issues | while IFS= read -r issue; do
  gh issue create \
    --title "$(echo "$issue" | jq -r '.title')" \
    --body "$(echo "$issue" | jq -r '.body')" \
    --label "$(echo "$issue" | jq -r '.labels[0]')"
done
```

### Derive API Contracts

```bash
aibrd api-contracts                        # markdown output
aibrd api-contracts --format openapi       # OpenAPI 3.0 YAML
aibrd api-contracts --module payments      # specific module
aibrd api-contracts --format openapi --module payments
```

Reads business flows from CONTEXT.md and infers REST endpoints, request bodies, and response codes.

Output saved to `.aibrd/<module>-openapi.yaml` or `.aibrd/<module>-api-contracts.md`.

> AI-derived draft — always review with the engineering team before implementation.

### Generate PO Progress Report

```bash
aibrd po-report v2.3.0
aibrd po-report v2.3.0 --range HEAD~30..HEAD
```

Produces a plain-English progress report for the Product Owner — **no requirement IDs visible, no technical jargon**:

- **What Was Asked For** — summary of requirements
- **What Was Built** — summary of git changes
- **Still To Do** — outstanding items
- **Risks & Notes** — anything the PO should know

Saved to `.aibrd/releases/po-report-v2.3.0.md`. Share the file directly with the PO.

### Map Compliance Frameworks

```bash
aibrd compliance                            # GDPR + WCAG (default)
aibrd compliance --fw GDPR --fw HIPAA
aibrd compliance --fw GDPR --fw WCAG --fw SOX --fw PCI-DSS
```

Available frameworks: `GDPR` `WCAG` `HIPAA` `SOX` `PCI-DSS` `ISO27001`

Scans all requirements and tags those with genuine compliance relevance:
- Specific clause (e.g. `GDPR Art. 17 — Right to erasure`)
- Rationale
- Risk level (high / medium / low)
- Dedicated High Risk Items section

Saved to `.aibrd/compliance-map.md`.

> Auto-generated mapping. Validate with your compliance team before submission.

---

## 10. Ingestion & Traceability Commands

### Ingest from Confluence

```bash
aibrd confluence \
  --url https://yourorg.atlassian.net \
  --space ENG \
  --page "Payment Processing BRD" \
  --token "$CONFLUENCE_TOKEN" \
  --email your@email.com     # Atlassian Cloud only; omit for Server/DC
```

Set `CONFLUENCE_TOKEN` as an environment variable to avoid passing it on the command line:

```bash
export CONFLUENCE_TOKEN=your-api-token
aibrd confluence --url https://yourorg.atlassian.net --space ENG --page "BRD"
```

Fetches the page and its direct child pages, strips HTML, and runs the full initialization pipeline. The output is identical to `aibrd init` from a file.

**Generate a Confluence API token:**
- Cloud: `https://id.atlassian.com/manage-profile/security/api-tokens`
- Server/DC: User profile → Personal Access Tokens

### Check Requirement Staleness

```bash
aibrd stale                     # all modules
aibrd stale --module payments   # specific module
```

Cross-references each BF-XXX ID against `git log` to find how long since any source file referencing that ID was last modified.

| Threshold | Verdict |
|---|---|
| < 14 days | 🟢 Ok |
| 14–30 days | 🟡 Drifting |
| > 30 days | 🔴 Stale |

Output saved to `.aibrd/staleness-report.md`. Exit code `1` if any stale requirements found — safe to use in CI.

**Improve detection** by adding comments in your source files:
```python
# aibrd: PAY-BF-001
def initiate_payment(amount, currency): ...
```

### Map Requirements to Test Files

```bash
aibrd test-linkage              # all modules
aibrd test-linkage --module auth
```

Scans all test files (`*.test.ts`, `*.spec.py`, `*Test.java`, `*_test.go`, etc.) for requirement ID mentions.

Output:
- Coverage percentage
- ✅ Covered requirements + which test files reference them
- ❌ Uncovered requirements
- Recommended actions

Saved to `.aibrd/test-linkage-report.md`.

**Improve detection** with inline comments:
```python
# aibrd: AUTH-AC-009
def test_sms_otp_password_reset(): ...
```

---

## 11. Use as a Python Library

Import aibrd modules directly in your scripts or pipelines.

### Parse a BRD

```python
from aibrd.parsers import parse_file

brd = parse_file("requirements.pdf")   # pdf, docx, md
print(f"Parsed {len(brd.text)} characters from {brd.source}")
```

### Ingest from Confluence

```python
from aibrd.parsers.confluence import ConfluenceConfig, ingest_confluence_page

cfg = ConfluenceConfig(
    base_url="https://yourorg.atlassian.net",
    space_key="ENG",
    page_title="Payment Processing BRD",
    token="your-api-token",
    email="your@email.com",     # Cloud only
)
brd = ingest_confluence_page(cfg)
```

### Extract Requirements

```python
from aibrd.extractors.flows import extract_flows
from aibrd.extractors.rules import extract_rules
from aibrd.extractors.actors import extract_actors
from aibrd.extractors.acceptance_criteria import extract_acceptance_criteria

flows = extract_flows(brd.text)
rules = extract_rules(brd.text)
actors = extract_actors(brd.text)
criteria = extract_acceptance_criteria(brd.text)
```

### Generate Sprint Tasks

```python
from aibrd.generators.sprint_feed import generate_sprint_feed, format_sprint_feed
from aibrd.models.outputs import BRDContent

content = BRDContent(flows=flows, rules=rules, criteria=criteria)
tasks = generate_sprint_feed(content)
print(format_sprint_feed(tasks, project_name="My Project"))
```

### Derive API Contracts

```python
from aibrd.generators.api_contracts import derive_api_contracts, format_api_contracts_as_openapi

content = BRDContent(flows=flows)
endpoints = derive_api_contracts(content)
yaml_spec = format_api_contracts_as_openapi(endpoints, "My Project", module_slug="payments")
print(yaml_spec)
```

### Map Compliance

```python
from aibrd.generators.compliance_mapper import map_compliance, format_compliance_map

tags = map_compliance([content], frameworks=["GDPR", "HIPAA"])
print(format_compliance_map(tags))
```

### Check Staleness

```python
from aibrd.analyzers.stale_detector import detect_stale_requirements, build_staleness_report

items = detect_stale_requirements(".aibrd", workspace_root="/path/to/repo")
report = build_staleness_report(items)
print(f"{report.stale_count} stale, {report.ok_count} ok")
```

### Link Test Files

```python
from aibrd.analyzers.test_linkage import link_test_files, build_test_linkage_report, format_test_linkage_report

links = link_test_files(".aibrd", workspace_root="/path/to/repo")
report = build_test_linkage_report(links)
print(format_test_linkage_report(report))
```

### Run Gap Analysis

```python
from aibrd.analyzers.gap_detector import detect_gaps, format_gap_report

context = open(".aibrd/CONTEXT.md").read()
code = open("src/payments/checkout.py").read()

gaps = detect_gaps(context, code)
print(format_gap_report(gaps))

# access gaps programmatically
for gap in gaps:
    if gap.status == "missing":
        print(f"MISSING: {gap.requirement_id} — {gap.requirement_summary}")
```

### Validate Integrity

```python
from aibrd.analyzers.validator import validate_aibrd_dir, format_validation_report

result = validate_aibrd_dir(".aibrd")
print(format_validation_report(result, ".aibrd"))
if not result.passed:
    raise SystemExit(1)
```

### Generate PO Report

```python
from aibrd.generators.po_report import generate_po_report, get_git_summary

git_summary = get_git_summary("/path/to/repo", git_range="HEAD~20..HEAD")
report = generate_po_report([content], git_summary, version="v2.3.0")
print(report)
```

### Full Pipeline Example

```python
import os
from aibrd.parsers import parse_file
from aibrd.chunker import chunk_brd
from aibrd.extractors.module_detector import detect_modules
from aibrd.extractors.flows import extract_flows
from aibrd.extractors.rules import extract_rules
from aibrd.generators.context_md import generate_context_md
from aibrd.generators.sprint_feed import generate_sprint_feed, format_sprint_feed
from aibrd.models.outputs import BRDContent
from aibrd.workspace.writer import init_structure, write_context, write_file

os.environ["ANTHROPIC_API_KEY"] = "sk-ant-..."

# 1. Parse
brd = parse_file("requirements.pdf")
chunks = chunk_brd(brd)

# 2. Detect modules
modules = detect_modules(brd.text)

# 3. Extract
flows = extract_flows(chunks[0].text)
rules = extract_rules(chunks[0].text)

# 4. Build content
content = BRDContent(
    module_slug=modules[0].slug if modules else None,
    flows=flows, rules=rules
)

# 5. Generate living spec
md = generate_context_md(content, version="1.0")
init_structure(".aibrd", modular=bool(modules))
write_context(".aibrd", md)

# 6. Generate sprint feed
tasks = generate_sprint_feed(content)
sprint_md = format_sprint_feed(tasks, project_name="My Project")
write_file(".aibrd/sprint-feed.md", sprint_md)

print(f"Done — {len(flows)} flows, {len(tasks)} sprint tasks")
```

---

## 12. Understanding the .aibrd/ Folder

Same structure as the VS Code extension — both tools are fully compatible.

### Flat Mode (small projects)

```
.aibrd/
├── registry.json           # ID counter — never reused
├── CONTEXT.md              # Living spec: actors, flows, rules, AC
├── index.md                # Traceability matrix
├── ambiguity-report.md     # Vague terms flagged at init
├── conflict-report.md      # Conflicting rules flagged at init
├── change-impact-report.md # New BRD version comparison
├── compliance-map.md       # Framework compliance tags
├── sprint-feed.md          # Developer sprint tasks
├── staleness-report.md     # Requirement staleness analysis
├── test-linkage-report.md  # Test file coverage mapping
├── openapi.yaml            # Derived REST API spec
├── api-contracts.md        # Derived REST API (Markdown)
├── tests/
│   └── test-cases.md
└── releases/
    ├── v1.0.md
    └── po-report-v1.0.md
```

### Modular Mode (large projects — auto-detected)

```
.aibrd/
├── registry.json
├── index.md
├── ambiguity-report.md
├── conflict-report.md
├── compliance-map.md         # across all modules
├── sprint-feed.md            # across all modules
├── staleness-report.md
├── test-linkage-report.md
├── modules/
│   ├── payments/
│   │   ├── CONTEXT.md        # PAY-BF-001, PAY-BR-001 ...
│   │   ├── PAY-openapi.yaml
│   │   ├── PAY-api-contracts.md
│   │   └── tests/
│   │       └── test-cases.md
│   ├── auth/
│   │   ├── CONTEXT.md
│   │   └── tests/
│   └── notifications/
│       └── CONTEXT.md
├── shared/
│   ├── actors.md
│   └── global-rules.md
└── releases/
    ├── v2.3.md
    └── po-report-v2.3.md
```

### registry.json — Never Edit Manually

```json
{
  "mode": "modular",
  "modules": {
    "payments": {
      "display_name": "Payment Processing",
      "prefix": "PAY",
      "counters": { "BF": 12, "BR": 24, "AC": 18, "FT": 3, "TC": 31, "RN": 2 }
    },
    "auth": {
      "display_name": "User Authentication",
      "prefix": "AUTH",
      "counters": { "BF": 5, "BR": 8, "AC": 6, "FT": 1, "TC": 11, "RN": 1 }
    }
  },
  "shared": { "ACT": 5, "GBR": 3 }
}
```

Counters only go up. IDs are never reused even if a requirement is deleted.

---

## 13. Stable ID Reference

| Scope | Format | Example |
|---|---|---|
| Small / flat | `TYPE-NNN` | `BF-001`, `BR-012` |
| Large / modular | `PREFIX-TYPE-NNN` | `PAY-BF-012`, `AUTH-BR-003` |
| Global actors | `ACT-NNN` | `ACT-003` |
| Global rules | `GBR-NNN` | `GBR-001` |

| Type | Full Name | Generated By |
|---|---|---|
| `ACT` | Actor | `aibrd init` |
| `BF` | Business Flow | `aibrd init` / `aibrd update` |
| `BR` | Business Rule | `aibrd init` / `aibrd update` |
| `AC` | Acceptance Criteria | `aibrd init` / `aibrd update` |
| `TC` | Test Case | `aibrd tests` |
| `RN` | Release Note | `aibrd release` |

---

## 14. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | One of these three | Use Anthropic Claude |
| `GITHUB_TOKEN` | One of these three | Use GitHub Models API (free) |
| `OPENAI_API_KEY` | One of these three | Use OpenAI |
| `AIBRD_MODEL` | Optional | Override default model |
| `AIBRD_CHUNK_TOKENS` | Optional | Max tokens per BRD chunk (default: 6000) |
| `CONFLUENCE_TOKEN` | Optional | Pre-set Confluence API token for `aibrd confluence` |

---

## 15. Troubleshooting

### "No LLM provider configured"

At least one of `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, or `OPENAI_API_KEY` must be set.

```bash
echo $ANTHROPIC_API_KEY   # check if set
export ANTHROPIC_API_KEY=sk-ant-...
```

### "Unsupported file type"

Only `.pdf`, `.docx`, `.doc`, and `.md` are supported. Convert other formats first:
```bash
# Convert PPTX to PDF via LibreOffice
libreoffice --headless --convert-to pdf presentation.pptx
```

### Confluence ingestion fails with 401 / 403

- **Cloud:** email + API token both required (`--email` + `--token`)
- **Server/DC:** Personal Access Token only, no `--email`
- Generate token: `https://id.atlassian.com/manage-profile/security/api-tokens`
- Ensure the token has `read:content` permission for the space

### Output is sparse / too few requirements extracted

- BRD may be image-based (scanned PDF). Export from Confluence as text PDF.
- Try `.docx` format instead.
- Lower chunk size: `export AIBRD_CHUNK_TOKENS=4000`

### `aibrd validate` fails with "broken cross-reference"

- A `_Rules: BR-001_` in a flow points to a rule ID that doesn't exist
- Either the rule was deleted manually, or it was never extracted
- Run `aibrd update` to re-add the missing rule, or remove the cross-reference from CONTEXT.md

### `aibrd stale` marks everything as stale

- Ensure requirement IDs (e.g. `PAY-BF-001`) appear in source files or comments
- Add `# aibrd: PAY-BF-001` inline comments in source or test files
- The workspace must be a git repository with commit history

### `aibrd test-linkage` shows 0% coverage

- Test files must contain the requirement ID string (e.g. `# aibrd: PAY-BF-001`)
- Supported test file patterns: `*.test.ts`, `*.spec.py`, `*Test.java`, `*_test.go`, `*.spec.js`
- Add inline comments to connect tests to requirements

### Sprint feed tasks are generic

- Enrich CONTEXT.md — ensure flows have descriptions, AC have full Given/When/Then
- Run `aibrd update "..."` to add detail before generating the sprint feed

### `aibrd release` — git diff returns nothing

```bash
aibrd release v1.0.0 --range HEAD~5..HEAD
```

Ensure you are in a git repo with commits before the specified range.

### JSON parse error from LLM

Some LLMs occasionally return malformed JSON. Retry the command. If it persists:
```bash
export AIBRD_MODEL=claude-sonnet-4-5
aibrd init ./brd.pdf
```

---

## 16. Quick Reference Card

| I want to... | Command |
|---|---|
| Start a project | `aibrd init ./brd.pdf` |
| Start from Confluence | `aibrd confluence --url … --space … --page …` |
| Add a PO requirement | `aibrd update "requirement text"` |
| Analyse a new BRD version | `aibrd change-impact ./brd-v2.pdf` |
| Validate spec integrity | `aibrd validate` |
| Generate test cases | `aibrd tests` |
| Generate tests for one module | `aibrd tests --module payments` |
| Check a file's coverage | `aibrd gaps src/payments.py` |
| Draft a PR description | `aibrd pr-draft` |
| Generate sprint tasks | `aibrd sprint` |
| Export sprint as GitHub Issues JSON | `aibrd sprint --github-issues` |
| Derive OpenAPI spec | `aibrd api-contracts --format openapi` |
| Plain-English PO report | `aibrd po-report v2.3.0` |
| Map compliance frameworks | `aibrd compliance --fw GDPR --fw HIPAA` |
| Check requirement staleness | `aibrd stale` |
| Link requirements to test files | `aibrd test-linkage` |
| Prepare release notes | `aibrd release v2.3.0` |
| Reinitialize with new BRD | `aibrd init ./brd-v2.pdf --force` |

---

## Using aibrd in an Org (GitHub Enterprise + Copilot)?

See the **[VS Code Extension Playbook](../PLAYBOOK.md)** for:
- No API key required — uses GitHub Copilot license
- `@aibrd` in Copilot Chat
- Org-wide VSIX deployment
- RTM tree view and webview panels
- Confluence ingestion with interactive credential input
