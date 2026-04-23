# aibrd

**BRD → Living Specification → Code Traceability**

aibrd converts Business Requirements Documents (BRDs) into a version-controlled, living specification inside your repository — keeping the thread between what the business asked for and what got shipped, alive permanently.

Available in two forms:

| | VS Code Extension | Python Library |
|---|---|---|
| **Who** | Org teams (GitHub Enterprise + Copilot) | Personal repos, scripts, CI pipelines |
| **LLM** | GitHub Copilot via `vscode.lm` — no key needed | Anthropic / GitHub Models / OpenAI — bring your key |
| **Usage** | Command palette + Copilot Chat | CLI (`aibrd init`) or `import aibrd` |
| **Docs** | [PLAYBOOK.md](PLAYBOOK.md) | [pythonlibrary/PLAYBOOK.md](pythonlibrary/PLAYBOOK.md) |

---

## The Problem

Most teams lose the thread between the BRD and the code within weeks of a project starting. Requirements get interpreted, partially implemented, or silently dropped. By the time a release ships, no one can confidently answer: *"Did we actually build what the business asked for?"*

aibrd keeps that thread alive — in the repo itself, versioned alongside the code.

---

## How It Works

```
BRD (PDF / Word / Markdown)
        ↓
  aibrd init  (CLI)  or  aibrd: Initialize from BRD  (VS Code)
        ↓
  .aibrd/
  ├── CONTEXT.md          ← living spec, versioned in git
  ├── index.md            ← requirement traceability matrix
  ├── ambiguity-report.md ← vague terms flagged
  ├── conflict-report.md  ← contradicting rules flagged
  └── modules/            ← auto-detected domains (large projects)
        ↓
  PO brings new requirement → aibrd update / aibrd: Update → CONTEXT.md stays current
        ↓
  Dev uses @aibrd tasks   → knows exactly what to build
  QA uses aibrd tests     → test cases auto-generated
  Lead uses aibrd release → release notes mapped to requirement IDs
```

---

## VS Code Extension

### Requirements

- VS Code 1.90+
- GitHub Copilot (Individual, Business, or Enterprise)
- GitHub Enterprise (for org-wide deployment)

### Installation

**Development:**
```bash
git clone https://github.com/anirudhyadav/aibrd.git
cd aibrd
npm install
# Press F5 in VS Code to launch Extension Development Host
```

**Org-wide deployment:**
```bash
npm install
npx vsce package
# Distribute aibrd-0.1.0.vsix via MDM or VS Code Server
```

### Commands

| Command | Who Uses It | What It Does |
|---|---|---|
| `aibrd: Initialize from BRD` | Tech Lead (once) | Parses PDF/Word/MD → generates full `.aibrd/` structure |
| `aibrd: Update with new requirement` | Lead Engineer | Adds PO requirement → appends to CONTEXT.md with new IDs |
| `aibrd: Generate Test Cases` | QA / Tester | Generates Given/When/Then test cases from CONTEXT.md |
| `aibrd: Generate Release Notes` | Lead / DevOps | Maps git diff to requirement IDs → release notes |
| `aibrd: Show Traceability Matrix` | Anyone | Refreshes the RTM tree view in the sidebar |
| `aibrd: Show Gap Report` | Dev / Lead | Checks open file against requirements for coverage gaps |

### Copilot Chat — @aibrd

```
@aibrd what is BF-003?
@aibrd tasks
@aibrd coverage
@aibrd rtm
```

| Command | Description |
|---|---|
| `@aibrd <any question>` | Answer questions about requirements using CONTEXT.md |
| `@aibrd tasks` | Break down requirements into developer tasks |
| `@aibrd coverage` | Check selected code against BRD requirements |
| `@aibrd rtm` | Show the traceability matrix in chat |

### Configuration

```json
// .vscode/settings.json or user settings
{
  "aibrd.preferredModel": "claude-sonnet-4-5",
  "aibrd.maxChunkTokens": 6000
}
```

---

## Python Library

### Requirements

- Python 3.10+
- One LLM provider key (see below)

### Installation

```bash
cd pythonlibrary
pip install -e .
```

### Configure LLM Provider

Set **one** environment variable — aibrd auto-detects which provider to use:

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # Claude (recommended)
export GITHUB_TOKEN=ghp_...           # GitHub Models (free with any GitHub account)
export OPENAI_API_KEY=sk-...          # OpenAI
```

### CLI Commands

```bash
aibrd init ./docs/brd.pdf             # initialize from BRD
aibrd update "new requirement text"   # add PO requirement
aibrd tests                           # generate test cases
aibrd gaps src/payments.py            # check file coverage
aibrd release v2.3.0                  # generate release notes
```

### Library Usage

```python
from aibrd.parsers import parse_file
from aibrd.extractors.flows import extract_flows
from aibrd.generators.context_md import generate_context_md
from aibrd.analyzers.gap_detector import detect_gaps, format_gap_report

brd = parse_file("requirements.pdf")
flows = extract_flows(brd.text)
gaps = detect_gaps(open(".aibrd/CONTEXT.md").read(), open("src/payments.py").read())
print(format_gap_report(gaps))
```

---

## The `.aibrd/` Folder

Both the VS Code extension and Python library write to the same `.aibrd/` format — they are fully compatible on the same repo.

**Commit `.aibrd/` to git** — it is the living specification for your project.

### Small Projects (flat mode)
```
.aibrd/
├── registry.json          # ID counter — never reused
├── CONTEXT.md             # All requirements: actors, flows, rules, AC
├── index.md               # Traceability matrix
├── ambiguity-report.md    # Vague terms flagged
├── conflict-report.md     # Contradicting rules
├── tests/
│   └── test-cases.md
└── releases/
    └── v1.0.md
```

### Large Projects (modular mode — auto-detected)
```
.aibrd/
├── registry.json
├── index.md               # Project overview + module list + RTM
├── modules/
│   ├── payments/
│   │   ├── CONTEXT.md     # PAY-BF-001, PAY-BR-001 ...
│   │   └── tests/
│   │       └── test-cases.md
│   ├── auth/
│   │   └── CONTEXT.md     # AUTH-BF-001, AUTH-BR-001 ...
│   └── notifications/
│       └── CONTEXT.md
├── shared/
│   ├── actors.md          # ACT-001 ... global actors
│   └── global-rules.md    # GBR-001 ... cross-cutting rules
└── releases/
    └── v2.3.md
```

Flat vs modular mode is auto-detected from the BRD size and structure. Module names are inferred by the LLM — no manual input needed.

---

## Stable Requirement IDs

Every extracted item gets a stable ID that never changes and is never reused.

| Scope | Format | Example |
|---|---|---|
| Small project | `TYPE-NNN` | `BF-001`, `BR-012` |
| Large project | `MOD-TYPE-NNN` | `PAY-BF-012`, `AUTH-BR-003` |
| Global actors | `ACT-NNN` | `ACT-001` |
| Global rules | `GBR-NNN` | `GBR-002` |

**Types:** `BF` Business Flow · `BR` Business Rule · `AC` Acceptance Criteria · `FT` Feature · `TC` Test Case · `RN` Release Note · `ACT` Actor

---

## CI/CD — GitHub Actions

Add one line to any repo's workflow:

```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

Uses `GITHUB_TOKEN` + GitHub Models API — no separate API key required.

---

## Personas

| Role | VS Code Extension | Python Library |
|---|---|---|
| **Tech Lead** | `aibrd: Initialize from BRD` | `aibrd init ./brd.pdf` |
| **Lead Engineer** | `aibrd: Update with new requirement` | `aibrd update "..."` |
| **Developer** | `@aibrd tasks` in Copilot Chat | — |
| **QA / Tester** | `aibrd: Generate Test Cases` | `aibrd tests` |
| **Release Manager** | `aibrd: Generate Release Notes` | `aibrd release v2.3.0` |
| **Personal / Explorer** | — | `pip install -e . && aibrd init` |

---

## Repository Structure

```
aibrd/
├── src/                          # VS Code Extension (TypeScript)
│   ├── extension.ts
│   ├── chat/                     # @aibrd Copilot Chat participant
│   ├── commands/                 # VS Code commands
│   ├── views/                    # Webview panels + tree views
│   ├── core/                     # Parsers, extractors, generators, analyzers
│   ├── llm/                      # vscode.lm wrapper — no API key
│   └── workspace/                # File system operations
├── pythonlibrary/                # Python Library + CLI
│   ├── aibrd/
│   │   ├── cli.py                # aibrd init / update / tests / gaps / release
│   │   ├── llm/client.py         # Anthropic / GitHub Models / OpenAI
│   │   ├── parsers/              # PDF, DOCX, Markdown
│   │   ├── extractors/           # Actors, flows, rules, AC, modules
│   │   ├── generators/           # CONTEXT.md, tests, RTM, reports
│   │   └── analyzers/            # Gap detection, change impact
│   ├── pyproject.toml
│   └── PLAYBOOK.md
├── .github/workflows/
│   └── aibrd-reusable.yml        # Reusable CI gap check
├── PLAYBOOK.md                   # VS Code Extension playbook
└── README.md
```

---

## Onboarding a New Team (VS Code Extension)

1. Export BRD from Confluence as PDF or Word
2. Open the project repo in VS Code
3. Run `aibrd: Initialize from BRD` → select the file
4. Review generated `.aibrd/` folder
5. Commit `.aibrd/` to git
6. Add the reusable workflow to CI
7. Share [PLAYBOOK.md](PLAYBOOK.md) with the team

## Getting Started (Python Library)

```bash
cd pythonlibrary
pip install -e .
export GITHUB_TOKEN=ghp_...   # free with any GitHub account
aibrd init ./my-brd.pdf
git add .aibrd/ && git commit -m "feat: add aibrd living spec"
```

See [pythonlibrary/PLAYBOOK.md](pythonlibrary/PLAYBOOK.md) for the full guide.

---

## License

MIT

## Author

Anirudh Yadav
