# aibrd

**BRD → Living Specification → Code Traceability**

aibrd converts Business Requirements Documents (BRDs) into a version-controlled, living specification inside your repository — keeping the thread between what the business asked for and what got shipped alive permanently.

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
BRD (PDF / Word / Markdown / Confluence)
        ↓
  aibrd init  or  aibrd: Initialize from BRD
        ↓
  .aibrd/
  ├── CONTEXT.md          ← living spec, versioned in git
  ├── index.md            ← requirement traceability matrix
  ├── ambiguity-report.md ← vague terms flagged
  ├── conflict-report.md  ← contradicting rules flagged
  └── modules/            ← auto-detected domains (large projects)
        ↓
  PO brings new requirement → aibrd update → CONTEXT.md stays current
        ↓
  Dev uses @aibrd tasks       → knows exactly what to build
  QA  uses aibrd tests        → test cases auto-generated
  Lead uses aibrd sprint      → sprint tasks with story points
  Lead uses aibrd release     → release notes mapped to IDs
  Lead uses aibrd po-report   → plain-English summary for PO
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
# Distribute aibrd-0.2.0.vsix via MDM or VS Code Server
```

### Commands — Core

| Command | Who Uses It | What It Does |
|---|---|---|
| `aibrd: Initialize from BRD` | Tech Lead (once) | Parses PDF/Word/MD → generates full `.aibrd/` structure |
| `aibrd: Update with new requirement` | Lead Engineer | Adds PO requirement → appends to CONTEXT.md with new IDs |
| `aibrd: Generate Test Cases` | QA / Tester | Generates Given/When/Then test cases from CONTEXT.md |
| `aibrd: Generate Release Notes` | Lead / DevOps | Maps git diff to requirement IDs → release notes |
| `aibrd: Show Traceability Matrix` | Anyone | Refreshes the RTM tree view in the sidebar |
| `aibrd: Show Gap Report` | Dev / Lead | Checks open file against requirements for coverage gaps |

### Commands — Quality & Analysis

| Command | What It Does |
|---|---|
| `aibrd: Analyse Change Impact` | Diff two BRD versions → flags new, changed, removed requirements |
| `aibrd: Validate CONTEXT.md` | Checks structure, cross-refs, duplicate IDs, missing changelogs |
| `aibrd: Draft Pull Request Description` | git diff + requirements → traceable PR description |

### Commands — Delivery Tools

| Command | What It Does |
|---|---|
| `aibrd: Generate Sprint Feed` | LLM → TASK-001 with story points, priority, AC checklist |
| `aibrd: Derive API Contracts` | Business flows → OpenAPI 3.0 YAML or Markdown spec |
| `aibrd: Generate PO Progress Report` | Plain-English progress report (no IDs visible) for PO sign-off |
| `aibrd: Map Compliance Frameworks` | Tag requirements to GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO27001 |

### Commands — Ingestion & Traceability

| Command | What It Does |
|---|---|
| `aibrd: Ingest from Confluence` | Fetch Confluence page + children directly via REST API |
| `aibrd: Check Requirement Staleness` | Cross-ref BF-XXX IDs against git log → flag 14/30-day drift |
| `aibrd: Link Requirements to Test Files` | Scan test files for requirement ID mentions → coverage % |

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
// .vscode/settings.json
{
  "aibrd.preferredModel": "claude-sonnet-4-5",
  "aibrd.maxChunkTokens": 6000,
  "aibrd.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

---

## Python Library

### Requirements

- Python 3.10+
- One LLM provider key (Anthropic / GitHub Models / OpenAI)

### Installation

```bash
cd pythonlibrary
pip install -e .
```

### Configure LLM Provider

Set **one** environment variable:

```bash
export ANTHROPIC_API_KEY=sk-ant-...   # Claude (recommended)
export GITHUB_TOKEN=ghp_...           # GitHub Models (free)
export OPENAI_API_KEY=sk-...          # OpenAI
```

### CLI Commands

**Core:**
```bash
aibrd init ./docs/brd.pdf             # initialize from BRD
aibrd update "new requirement text"   # add PO requirement
aibrd tests                           # generate test cases
aibrd gaps src/payments.py            # check file coverage
aibrd release v2.3.0                  # generate release notes
```

**Quality & Analysis:**
```bash
aibrd validate                        # validate .aibrd/ integrity
aibrd pr-draft --base main            # draft PR description
aibrd change-impact ./brd-v2.pdf      # analyse BRD change impact
```

**Delivery Tools:**
```bash
aibrd sprint                          # generate sprint tasks
aibrd sprint --github-issues          # output as GitHub Issues JSON
aibrd api-contracts --format openapi  # derive OpenAPI spec
aibrd po-report v2.3.0                # plain-English PO report
aibrd compliance --fw GDPR --fw HIPAA # compliance mapping
```

**Ingestion & Traceability:**
```bash
aibrd confluence --url https://org.atlassian.net --space ENG --page "Payment BRD" --token ...
aibrd stale                           # staleness report
aibrd test-linkage                    # test file coverage report
```

### Library Usage

```python
from aibrd.parsers import parse_file
from aibrd.extractors.flows import extract_flows
from aibrd.generators.context_md import generate_context_md
from aibrd.generators.sprint_feed import generate_sprint_feed, format_sprint_feed
from aibrd.generators.compliance_mapper import map_compliance
from aibrd.analyzers.gap_detector import detect_gaps, format_gap_report
from aibrd.analyzers.stale_detector import detect_stale_requirements
from aibrd.analyzers.test_linkage import link_test_files

brd = parse_file("requirements.pdf")
flows = extract_flows(brd.text)
gaps = detect_gaps(open(".aibrd/CONTEXT.md").read(), open("src/payments.py").read())
print(format_gap_report(gaps))
```

---

## The `.aibrd/` Folder

Both tools write to the same format — fully compatible on the same repo. **Commit `.aibrd/` to git.**

### Small Projects (flat mode)
```
.aibrd/
├── registry.json          # ID counter — never reused
├── CONTEXT.md             # All requirements: actors, flows, rules, AC
├── index.md               # Traceability matrix
├── ambiguity-report.md    # Vague terms flagged
├── conflict-report.md     # Contradicting rules
├── change-impact-report.md
├── compliance-map.md
├── sprint-feed.md
├── staleness-report.md
├── test-linkage-report.md
├── openapi.yaml / api-contracts.md
├── tests/
│   └── test-cases.md
└── releases/
    ├── v1.0.md
    └── po-report-v1.0.md
```

### Large Projects (modular mode — auto-detected)
```
.aibrd/
├── registry.json
├── index.md
├── ambiguity-report.md
├── conflict-report.md
├── compliance-map.md
├── sprint-feed.md
├── staleness-report.md
├── test-linkage-report.md
├── modules/
│   ├── payments/
│   │   ├── CONTEXT.md     # PAY-BF-001, PAY-BR-001 ...
│   │   ├── PAY-openapi.yaml
│   │   └── tests/
│   │       └── test-cases.md
│   ├── auth/
│   │   └── CONTEXT.md
│   └── notifications/
│       └── CONTEXT.md
├── shared/
│   ├── actors.md
│   └── global-rules.md
└── releases/
    ├── v2.3.md
    └── po-report-v2.3.md
```

---

## Stable Requirement IDs

Every extracted item gets a stable ID that never changes and is never reused.

| Scope | Format | Example |
|---|---|---|
| Small project | `TYPE-NNN` | `BF-001`, `BR-012` |
| Large project | `MOD-TYPE-NNN` | `PAY-BF-012`, `AUTH-BR-003` |
| Global actors | `ACT-NNN` | `ACT-001` |
| Global rules | `GBR-NNN` | `GBR-002` |

**Types:** `BF` Business Flow · `BR` Business Rule · `AC` Acceptance Criteria · `TC` Test Case · `RN` Release Note · `ACT` Actor

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

| Role | VS Code Extension | Python CLI |
|---|---|---|
| **Tech Lead** | `aibrd: Initialize from BRD` | `aibrd init ./brd.pdf` |
| **Lead Engineer** | `aibrd: Update with new requirement` | `aibrd update "..."` |
| **Developer** | `@aibrd tasks` in Copilot Chat | — |
| **QA / Tester** | `aibrd: Generate Test Cases` | `aibrd tests` |
| **Release Manager** | `aibrd: Generate Release Notes` | `aibrd release v2.3.0` |
| **Scrum Master** | `aibrd: Generate Sprint Feed` | `aibrd sprint` |
| **Architect** | `aibrd: Derive API Contracts` | `aibrd api-contracts` |
| **Compliance Officer** | `aibrd: Map Compliance Frameworks` | `aibrd compliance --fw GDPR` |
| **Product Owner** | receives `aibrd: Generate PO Progress Report` | receives `aibrd po-report` |
| **Personal / Explorer** | — | `pip install -e . && aibrd init` |

---

## Repository Structure

```
aibrd/
├── src/                          # VS Code Extension (TypeScript)
│   ├── extension.ts              # Registers all 16 commands + chat participant
│   ├── chat/                     # @aibrd Copilot Chat participant
│   ├── commands/                 # 16 VS Code commands
│   │   ├── init.ts, update.ts, generateTests.ts, releaseNotes.ts
│   │   ├── changeImpact.ts, validateContext.ts, prDraft.ts
│   │   ├── sprintFeed.ts, apiContracts.ts, poReport.ts, complianceMapper.ts
│   │   └── ingestConfluence.ts, staleDetector.ts, testLinkage.ts
│   ├── views/                    # Webview panels + tree views
│   ├── core/
│   │   ├── parsers/              # PDF, DOCX, Markdown, Confluence
│   │   ├── extractors/           # Actors, flows, rules, AC, module detector
│   │   ├── generators/           # CONTEXT.md, tests, RTM, sprint, API contracts,
│   │   │                         # PO report, compliance mapper
│   │   └── analyzers/            # Gap detector, change impact, validator,
│   │                             # stale detector, test linkage
│   ├── llm/                      # vscode.lm wrapper — no API key
│   └── workspace/                # File system operations
├── pythonlibrary/                # Python Library + CLI
│   ├── aibrd/
│   │   ├── cli.py                # 15 CLI commands
│   │   ├── llm/client.py         # Anthropic / GitHub Models / OpenAI
│   │   ├── parsers/              # PDF, DOCX, Markdown, Confluence
│   │   ├── extractors/           # Actors, flows, rules, AC, modules
│   │   ├── generators/           # CONTEXT.md, tests, RTM, sprint, API contracts,
│   │   │                         # PO report, compliance mapper
│   │   └── analyzers/            # Gap, change impact, validator,
│   │                             # stale detector, test linkage
│   ├── pyproject.toml
│   └── PLAYBOOK.md
├── .github/workflows/
│   └── aibrd-reusable.yml        # Reusable CI gap check
├── PLAYBOOK.md                   # VS Code Extension playbook
└── README.md
```

---

## Onboarding a New Team (VS Code Extension)

1. Export BRD from Confluence as PDF or Word (or use `aibrd: Ingest from Confluence` directly)
2. Open the project repo in VS Code
3. Run `aibrd: Initialize from BRD` → select the file
4. Review generated `.aibrd/` folder — resolve ambiguity and conflict reports
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
