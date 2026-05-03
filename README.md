# AIBRD — BRD to Living Specification

> Convert Business Requirements Documents into a version-controlled, living specification inside your repository — keeping the thread between what the business asked for and what got shipped alive permanently.

---

## The Problem AIBRD Solves

Most teams lose the connection between the BRD and the code within weeks of a project starting. Requirements get interpreted, partially implemented, or silently dropped. By the time a release ships, no one can confidently answer: *"Did we actually build what the business asked for?"*

**AIBRD keeps that thread alive — in the repo itself, versioned alongside the code.**

---

## Two Delivery Paths

| | Option A — MD Prompts | Option B — VS Code Extension |
|---|---|---|
| **Setup** | Zero. Copy-paste markdown. | Install extension + GitHub Copilot |
| **LLM** | Any — paste into Claude, ChatGPT, Gemini, Copilot | GitHub Copilot via `vscode.lm` — no API key needed |
| **Best for** | Individuals, one-off BRDs, any LLM preference | Org teams on GitHub Enterprise + Copilot |
| **Output** | Paste result into `.aibrd/CONTEXT.md` | Auto-writes `.aibrd/` in repo |
| **Docs** | [`prompts/README.md`](prompts/README.md) | [`PLAYBOOK.md`](PLAYBOOK.md) |

---

## Repository Structure

```
aibrd/
├── README.md                              ← you are here
├── FEATURES.md                            ← complete feature reference
├── PLAYBOOK.md                            ← VS Code extension full guide
│
├── prompts/                               ← Option A: copy-paste templates (zero setup)
│   ├── README.md
│   ├── extract-requirements.md            ← BRD → actors / flows / rules / AC
│   ├── gap-analysis.md                    ← code file vs CONTEXT.md coverage check
│   ├── sprint-feed.md                     ← CONTEXT.md → sprint tasks with story points
│   ├── change-impact.md                   ← old BRD vs new BRD delta analysis
│   └── compliance-map.md                  ← requirements vs GDPR/WCAG/HIPAA/SOX/PCI-DSS
│
└── vscodebase/                            ← Option B: VS Code Extension (TypeScript)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── extension.ts                   ← registers all 16 commands + @aibrd participant
        ├── chat/                          ← @aibrd Copilot Chat participant
        ├── commands/                      ← 16 VS Code commands
        ├── core/
        │   ├── parsers/                   ← PDF, DOCX, Markdown, Confluence
        │   ├── extractors/                ← actors, flows, rules, AC, module detector
        │   ├── generators/                ← CONTEXT.md, tests, RTM, sprint, API, PO report
        │   └── analyzers/                 ← gap, change impact, staleness, test linkage
        ├── llm/                           ← vscode.lm wrapper — no API key required
        ├── views/                         ← RTM tree view, gap report panel
        └── workspace/                     ← workspace reader/writer/detector
```

---

## Quick Start

### Option A — Zero Setup (5 minutes)

1. Open [`prompts/extract-requirements.md`](prompts/extract-requirements.md)
2. Replace `[PASTE YOUR BRD TEXT HERE]` with your BRD content
3. Paste into any LLM (Claude, ChatGPT, Copilot Chat, Gemini)
4. Copy the output into `.aibrd/CONTEXT.md` in your repo
5. Commit it — your team now has a living spec

### Option B — VS Code Extension

```bash
cd vscodebase
npm install
# Press F5 in VS Code to launch Extension Development Host
# Command Palette → aibrd: Initialize from BRD → select your PDF or Word file
```

**Org-wide deployment:**
```bash
cd vscodebase
npm install && npm run package
# Distribute aibrd-0.2.0.vsix via MDM or VS Code Server
code --install-extension aibrd-0.2.0.vsix
```

---

## The `.aibrd/` Folder

Both delivery paths write to the same format — **commit `.aibrd/` to git.**

```
.aibrd/
├── registry.json              # ID counter — never reused
├── CONTEXT.md                 # Living spec: actors, flows, rules, AC
├── index.md                   # Requirement traceability matrix
├── ambiguity-report.md        # Vague terms flagged for PO resolution
├── conflict-report.md         # Contradicting requirements flagged
├── change-impact-report.md
├── compliance-map.md
├── sprint-feed.md
├── staleness-report.md
├── test-linkage-report.md
├── openapi.yaml
├── tests/test-cases.md
└── releases/
    ├── v1.0.md
    └── po-report-v1.0.md
```

**Stable IDs — never deleted, never reused:**

| Format | Example | Scope |
|---|---|---|
| `TYPE-NNN` | `BF-001`, `BR-012` | Small projects |
| `MOD-TYPE-NNN` | `PAY-BF-012`, `AUTH-BR-003` | Large/modular projects |
| `ACT-NNN` | `ACT-001` | Global actors |
| `GBR-NNN` | `GBR-002` | Global rules |

**Types:** `BF` Business Flow · `BR` Business Rule · `AC` Acceptance Criteria · `TC` Test Case · `RN` Release Note · `ACT` Actor

---

## VS Code Commands

### Core
| Command | Who | What |
|---|---|---|
| `aibrd: Initialize from BRD` | Tech Lead | PDF/Word/MD → full `.aibrd/` |
| `aibrd: Update with new requirement` | Lead Engineer | Append PO requirement to CONTEXT.md |
| `aibrd: Generate Test Cases` | QA | Given/When/Then from CONTEXT.md |
| `aibrd: Generate Release Notes` | Release Manager | git diff → requirement ID mapped notes |
| `aibrd: Show Traceability Matrix` | Anyone | RTM tree view |
| `aibrd: Show Gap Report` | Dev / Lead | Open file vs requirements coverage |

### Analysis & Quality
| Command | What |
|---|---|
| `aibrd: Analyse Change Impact` | Diff two BRD versions → flag new/changed/removed |
| `aibrd: Validate CONTEXT.md` | Check structure, cross-refs, duplicate IDs |
| `aibrd: Draft Pull Request Description` | git diff + requirements → traceable PR |

### Delivery Tools
| Command | What |
|---|---|
| `aibrd: Generate Sprint Feed` | CONTEXT.md → TASK-NNN with story points + AC |
| `aibrd: Derive API Contracts` | Business flows → OpenAPI 3.0 YAML |
| `aibrd: Generate PO Progress Report` | Plain-English built-vs-asked report for PO sign-off |
| `aibrd: Map Compliance Frameworks` | Tag requirements to GDPR/WCAG/HIPAA/SOX/PCI-DSS/ISO27001 |

### Ingestion & Traceability
| Command | What |
|---|---|
| `aibrd: Ingest from Confluence` | Fetch Confluence page + children via REST API |
| `aibrd: Check Requirement Staleness` | Cross-ref BF-XXX IDs against git log → flag drift |
| `aibrd: Link Requirements to Test Files` | Scan test files for ID mentions → coverage % |

### Copilot Chat — @aibrd
```
@aibrd what is BF-003?
@aibrd tasks
@aibrd coverage
@aibrd rtm
```

---

## Configuration

```json
// .vscode/settings.json
{
  "aibrd.preferredModel": "claude-sonnet-4-6",
  "aibrd.maxChunkTokens": 6000,
  "aibrd.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

## CI/CD

```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

Uses `GITHUB_TOKEN` + GitHub Models API — no separate API key required.

---

## Requirements

| | Option A | Option B |
|---|---|---|
| GitHub Copilot | Optional | Required (Business or Enterprise) |
| VS Code | Any | 1.93+ |
| Node.js | No | 18+ (build only) |
| API keys | None | None |

---

## Important: Review Before Committing

Option A prompt output must be reviewed before committing. The LLM may misclassify requirements, merge flows that should be separate, or miss edge cases in complex BRDs.

1. Read generated CONTEXT.md before committing
2. Resolve all items in `ambiguity-report.md` with the business
3. Never silently accept IDs — fix before they become load-bearing in tests and release notes
4. The `registry.json` ID counter must never be edited manually

---

## License

MIT — Author: Anirudh Yadav
