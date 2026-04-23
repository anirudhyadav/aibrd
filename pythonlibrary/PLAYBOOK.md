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
8. [Use as a Python Library](#8-use-as-a-python-library)
9. [Understanding the .aibrd/ Folder](#9-understanding-the-aibrd-folder)
10. [Stable ID Reference](#10-stable-id-reference)
11. [Environment Variables](#11-environment-variables)
12. [Troubleshooting](#12-troubleshooting)

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

Or install dependencies directly without editable install:
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
  init     Parse a BRD file and generate the full .aibrd/ living specification.
  update   Add a new PO requirement to CONTEXT.md with auto-assigned IDs.
  tests    Generate Given/When/Then test cases from CONTEXT.md.
  gaps     Check a source file against BRD requirements for coverage gaps.
  release  Generate release notes mapping git changes to requirement IDs.
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

### Examples

```bash
aibrd init ./docs/payment-service-brd.pdf
aibrd init ./docs/requirements.docx
aibrd init ./specs/feature-spec.md
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

### Force Reinitialize

Use `--force` when a new BRD version is available:
```bash
aibrd init ./docs/brd-v2.pdf --force
```

---

## 4. Add a New Requirement

When the PO brings new requirements (email, Jira, verbal), add them directly:

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

**Convention:** include the requirement ID in your commit message for permanent audit trail.

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

Check any source file against the BRD requirements:

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

### What Happens

1. Reads the git diff for the specified range
2. Loads `index.md` (the RTM) as requirement context
3. Calls LLM to map changed files to requirement IDs
4. Generates structured release notes
5. Saves to `.aibrd/releases/<version>.md`

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

### Commit Release Notes

```bash
git add .aibrd/releases/
git commit -m "release: v2.3.0 notes — PAY-BF-003, AUTH-BF-004"
```

---

## 8. Use as a Python Library

Import aibrd modules directly in your scripts or pipelines.

### Parse a BRD

```python
from aibrd.parsers import parse_file

brd = parse_file("requirements.pdf")   # pdf, docx, md
print(f"Parsed {len(brd.text)} characters from {brd.source}")
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

### Detect Modules

```python
from aibrd.extractors.module_detector import detect_modules

modules = detect_modules(brd.text)
for m in modules:
    print(f"{m.display_name} → slug: {m.slug}, prefix: {m.prefix}")
```

### Generate CONTEXT.md

```python
from aibrd.models.outputs import BRDContent, BusinessFlow, FlowStep
from aibrd.generators.context_md import generate_context_md

content = BRDContent(flows=[...], rules=[...], criteria=[...])
md = generate_context_md(content, version="1.0")
print(md)
```

### Run Gap Analysis

```python
from aibrd.analyzers.gap_detector import detect_gaps, format_gap_report

context = open(".aibrd/CONTEXT.md").read()
code = open("src/payments/checkout.py").read()

gaps = detect_gaps(context, code)
print(format_gap_report(gaps))

# or access gaps programmatically
for gap in gaps:
    if gap.status == "missing":
        print(f"MISSING: {gap.requirement_id} — {gap.requirement_summary}")
```

### Detect Ambiguities

```python
from aibrd.generators.ambiguity_report import detect_ambiguities, format_ambiguity_report

ambiguities = detect_ambiguities(brd.text)
print(format_ambiguity_report(ambiguities))
```

### Detect Conflicts

```python
from aibrd.generators.conflict_detector import detect_conflicts, format_conflict_report
from aibrd.models.outputs import BusinessRule

rules = [BusinessRule(id="BR-001", description="..."), ...]
conflicts = detect_conflicts(rules)
print(format_conflict_report(conflicts))
```

### Call LLM Directly

```python
from aibrd.llm.client import call_llm, call_llm_json

# Plain text response
response = call_llm(
    prompt="Summarize the key actors in this BRD: ...",
    system="You are a business analyst."
)

# JSON response
data = call_llm_json(
    prompt="Extract all business rules as JSON",
    system="Return JSON: {rules: [{description: '...'}]}"
)
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
from aibrd.generators.ambiguity_report import detect_ambiguities
from aibrd.models.outputs import BRDContent
from aibrd.workspace.writer import init_structure, write_context

os.environ["ANTHROPIC_API_KEY"] = "sk-ant-..."

# 1. Parse
brd = parse_file("requirements.pdf")
chunks = chunk_brd(brd)

# 2. Detect modules
modules = detect_modules(brd.text)

# 3. Extract
flows = extract_flows(chunks[0].text)
rules = extract_rules(chunks[0].text)

# 4. Build content (assign IDs manually or use registry)
content = BRDContent(
    module_slug=modules[0].slug if modules else None,
)

# 5. Generate
md = generate_context_md(content, version="1.0")

# 6. Write
init_structure(".aibrd", modular=bool(modules))
write_context(".aibrd", md)
print("Done — .aibrd/ written")
```

---

## 9. Understanding the .aibrd/ Folder

Same structure as the VS Code extension — both tools are fully compatible.

### Flat Mode (small projects)

```
.aibrd/
├── registry.json          # ID counter — never reused
├── CONTEXT.md             # Living spec: actors, flows, rules, AC
├── index.md               # Traceability matrix
├── ambiguity-report.md    # Vague terms flagged at init
├── conflict-report.md     # Conflicting rules flagged at init
├── tests/
│   └── test-cases.md      # Generated by `aibrd tests`
└── releases/
    └── v1.0.md            # Generated by `aibrd release`
```

### Modular Mode (large projects — auto-detected)

```
.aibrd/
├── registry.json
├── index.md
├── modules/
│   ├── payments/
│   │   ├── CONTEXT.md     # PAY-BF-001, PAY-BR-001 ...
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

## 10. Stable ID Reference

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

## 11. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | One of these three | Use Anthropic Claude |
| `GITHUB_TOKEN` | One of these three | Use GitHub Models API (free) |
| `OPENAI_API_KEY` | One of these three | Use OpenAI |
| `AIBRD_MODEL` | Optional | Override default model |
| `AIBRD_CHUNK_TOKENS` | Optional | Max tokens per BRD chunk (default: 6000) |

---

## 12. Troubleshooting

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

### Output is sparse / too few requirements extracted

- BRD may be image-based (scanned PDF). Export from Confluence as text PDF.
- Try `.docx` format instead — Word preserves text more reliably.
- Lower chunk size: `export AIBRD_CHUNK_TOKENS=4000` to process in smaller passes.

### Module detection puts everything in one module

- May be correct — single-domain BRDs use flat mode.
- If you expect multiple modules, ensure the BRD has clear headings per domain.

### `aibrd update` creates a new module unexpectedly

The LLM detected that the new requirement doesn't match any existing module. If this is wrong, manually move the generated content to the correct module's `CONTEXT.md` and delete the new one from `registry.json` counters.

### JSON parse error from LLM

Some LLMs occasionally return malformed JSON. Retry the command — aibrd will call the LLM again. If it persists, try a different model:
```bash
export AIBRD_MODEL=claude-sonnet-4-5
aibrd init ./brd.pdf
```

### `git diff` returns nothing for `aibrd release`

Ensure you are in a git repo with commits. Provide an explicit range:
```bash
aibrd release v1.0.0 --range HEAD~5..HEAD
```

---

## Quick Reference Card

| I want to... | Command |
|---|---|
| Start a project | `aibrd init ./brd.pdf` |
| Add a PO requirement | `aibrd update "requirement text"` |
| Generate test cases | `aibrd tests` |
| Generate tests for one module | `aibrd tests --module payments` |
| Check a file's coverage | `aibrd gaps src/payments.py` |
| Check coverage in a module | `aibrd gaps src/payments.py --module payments` |
| Prepare release notes | `aibrd release v2.3.0` |
| Reinitialize with new BRD | `aibrd init ./brd-v2.pdf --force` |

---

## Using aibrd in an Org (GitHub Enterprise + Copilot)?

See the **[VS Code Extension Playbook](../PLAYBOOK.md)** for:
- No API key required — uses GitHub Copilot license
- `@aibrd` in Copilot Chat
- Org-wide VSIX deployment
- RTM tree view and webview panels
