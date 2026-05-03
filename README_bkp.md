# aibrd — BRD → Living Specification → Code Traceability

> Convert Business Requirements Documents into a version-controlled, living specification inside your repository — keeping the thread between what the business asked for and what got shipped alive permanently.

---

## 📖 Start Here

Most teams lose the thread between the BRD and the code within weeks of a project starting. Requirements get interpreted, partially implemented, or silently dropped. By the time a release ships, no one can confidently answer: *"Did we actually build what the business asked for?"*

**aibrd keeps that thread alive — in the repo itself, versioned alongside the code.**

Three ways to use it:

| | Option A — Prompts | Option B — VS Code Extension | Option C — Python Library |
|---|---|---|---|
| **Setup** | Zero. Copy-paste markdown. | Install extension + GitHub Copilot | `pip install -e .` |
| **LLM** | Any — paste into ChatGPT, Claude, Copilot | GitHub Copilot via `vscode.lm` — no key needed | Anthropic / GitHub Models / OpenAI |
| **Best for** | Individuals, one-off BRDs, air-gapped | Org teams (GitHub Enterprise + Copilot) | Personal repos, scripts, CI pipelines |
| **Output** | Paste result into `.aibrd/CONTEXT.md` | Auto-writes `.aibrd/` in repo | Auto-writes `.aibrd/` in repo |
| **Docs** | [`prompts/README.md`](prompts/README.md) | [`PLAYBOOK.md`](PLAYBOOK.md) | [`pythonlibrary/PLAYBOOK.md`](pythonlibrary/PLAYBOOK.md) |

---

## 📁 Folder Layout

```
aibrd/
├── prompts/                          # ← Option A: copy-paste templates (zero setup)
│   ├── README.md                     # How to use the templates
│   ├── extract-requirements.md       # BRD → actors / flows / rules / AC
│   ├── gap-analysis.md               # Code file vs CONTEXT.md coverage check
│   ├── sprint-feed.md                # CONTEXT.md → sprint tasks with story points
│   ├── change-impact.md              # Old BRD vs new BRD delta analysis
│   └── compliance-map.md             # Requirements vs GDPR/WCAG/HIPAA/SOX/PCI-DSS
│
├── src/                              # ← Option B: VS Code Extension (TypeScript)
│   ├── extension.ts                  # Registers all 16 commands + chat participant
│   ├── chat/                         # @aibrd Copilot Chat participant
│   ├── commands/                     # 16 VS Code commands
│   │   ├── init.ts, update.ts, generateTests.ts, releaseNotes.ts
│   │   ├── changeImpact.ts, validateContext.ts, prDraft.ts
│   │   ├── sprintFeed.ts, apiContracts.ts, poReport.ts, complianceMapper.ts
│   │   └── ingestConfluence.ts, staleDetector.ts, testLinkage.ts
│   ├── core/
│   │   ├── parsers/                  # PDF, DOCX, Markdown, Confluence
│   │   ├── extractors/               # Actors, flows, rules, AC, module detector
│   │   ├── generators/               # CONTEXT.md, tests, RTM, sprint, API, PO report
│   │   └── analyzers/                # Gap, change impact, validator, stale, test linkage
│   └── llm/                          # vscode.lm wrapper — no API key required
│
├── pythonlibrary/                    # ← Option C: Python Library + CLI
│   ├── aibrd/
│   │   ├── cli.py                    # 15 CLI commands
│   │   ├── llm/client.py             # Anthropic / GitHub Models / OpenAI
│   │   ├── parsers/                  # PDF, DOCX, Markdown, Confluence
│   │   ├── extractors/               # Actors, flows, rules, AC, modules
│   │   ├── generators/               # CONTEXT.md, tests, RTM, sprint, API, PO report
│   │   └── analyzers/                # Gap, change impact, validator, stale, test linkage
│   ├── pyproject.toml
│   └── PLAYBOOK.md
│
├── .github/workflows/
│   └── aibrd-reusable.yml            # Reusable CI gap check (GitHub Actions)
├── scripts/build_ppt.py              # Product deck generator
├── WORKING_PLAN.md                   # Enterprise rollout guide (4-week plan)
├── PLAYBOOK.md                       # VS Code Extension full guide
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Option A — Zero Setup (5 minutes)

1. Open [`prompts/extract-requirements.md`](prompts/extract-requirements.md)
2. Replace `[PASTE YOUR BRD TEXT HERE]` with your BRD content
3. Paste into any LLM (Claude, ChatGPT, Copilot Chat)
4. Copy the output into `.aibrd/CONTEXT.md` in your repo
5. Commit it — your team now has a living spec

### Option B — VS Code Extension

```bash
git clone https://github.com/anirudhyadav/aibrd.git
cd aibrd
npm install
# Press F5 in VS Code to launch Extension Development Host
```

Run `aibrd: Initialize from BRD` from the Command Palette → select your PDF or Word file → done.

**Org-wide deployment:**
```bash
npm install && npx vsce package
# Distribute aibrd-0.2.0.vsix via MDM or VS Code Server
```

### Option C — Python Library

```bash
cd pythonlibrary
pip install -e .
export GITHUB_TOKEN=ghp_...   # free with any GitHub account
aibrd init ./my-brd.pdf
git add .aibrd/ && git commit -m "feat: add aibrd living spec"
```

---

## ⚡ Option A vs B vs C — When to Use Which

| Criteria | Option A (Prompts) | Option B (VS Code) | Option C (Python) |
|---|---|---|---|
| **Time to first output** | 5 min | 15 min (setup) | 10 min (setup) |
| **Ongoing updates** | Manual copy-paste | `aibrd: Update` command | `aibrd update "..."` |
| **CI/CD integration** | ❌ | ✅ (GitHub Actions) | ✅ |
| **Confluence ingestion** | ❌ | ✅ | ✅ |
| **Requires API key** | No | No (uses Copilot) | Yes (one provider) |
| **Works offline / air-gapped** | ✅ | ❌ | ❌ |
| **Modular (large projects)** | ❌ | ✅ auto-detected | ✅ auto-detected |
| **Traceability matrix** | Manual | ✅ sidebar tree | ✅ `aibrd validate` |
| **@aibrd chat in Copilot** | ❌ | ✅ | ❌ |
| **Best team size** | 1–3 | 5–50+ | 1–20 |

**Verdict:** Start with Option A to prove the value. Migrate to Option B once the team is on GitHub Enterprise + Copilot. Use Option C for CI automation or if you prefer the terminal.

---

## 📂 The `.aibrd/` Folder

Both Option B and C write the same format — **commit `.aibrd/` to git.**

```
.aibrd/
├── registry.json          # ID counter — never reused
├── CONTEXT.md             # Living spec: actors, flows, rules, AC
├── index.md               # Traceability matrix
├── ambiguity-report.md    # Vague terms flagged for resolution
├── conflict-report.md     # Contradicting rules flagged
├── change-impact-report.md
├── compliance-map.md
├── sprint-feed.md
├── staleness-report.md
├── test-linkage-report.md
├── openapi.yaml
├── tests/
│   └── test-cases.md
└── releases/
    ├── v1.0.md
    └── po-report-v1.0.md
```

Every extracted item gets a **stable ID that never changes and is never reused:**

| Scope | Format | Example |
|---|---|---|
| Small project | `TYPE-NNN` | `BF-001`, `BR-012` |
| Large project | `MOD-TYPE-NNN` | `PAY-BF-012`, `AUTH-BR-003` |
| Global actors | `ACT-NNN` | `ACT-001` |
| Global rules | `GBR-NNN` | `GBR-002` |

**Types:** `BF` Business Flow · `BR` Business Rule · `AC` Acceptance Criteria · `TC` Test Case · `RN` Release Note · `ACT` Actor

---

## 🛠 VS Code Commands (Option B)

### Core
| Command | Who | What |
|---|---|---|
| `aibrd: Initialize from BRD` | Tech Lead (once) | PDF/Word/MD → full `.aibrd/` |
| `aibrd: Update with new requirement` | Lead Engineer | PO requirement → append to CONTEXT.md |
| `aibrd: Generate Test Cases` | QA | Given/When/Then from CONTEXT.md |
| `aibrd: Generate Release Notes` | Release Manager | git diff → requirement ID mapped notes |
| `aibrd: Show Traceability Matrix` | Anyone | Refreshes RTM tree view |
| `aibrd: Show Gap Report` | Dev / Lead | Open file vs requirements coverage |

### Quality & Analysis
| Command | What |
|---|---|
| `aibrd: Analyse Change Impact` | Diff two BRD versions → flag new/changed/removed |
| `aibrd: Validate CONTEXT.md` | Check structure, cross-refs, duplicate IDs |
| `aibrd: Draft Pull Request Description` | git diff + requirements → traceable PR |

### Delivery Tools
| Command | What |
|---|---|
| `aibrd: Generate Sprint Feed` | CONTEXT.md → TASK-001 with story points + AC |
| `aibrd: Derive API Contracts` | Business flows → OpenAPI 3.0 YAML |
| `aibrd: Generate PO Progress Report` | Plain-English report for PO sign-off |
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

## 🐍 Python CLI Commands (Option C)

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

---

## 👥 Personas

| Role | Option A | Option B (VS Code) | Option C (Python) |
|---|---|---|---|
| **Tech Lead** | Extract requirements prompt | `aibrd: Initialize from BRD` | `aibrd init ./brd.pdf` |
| **Lead Engineer** | — | `aibrd: Update with new requirement` | `aibrd update "..."` |
| **Developer** | Gap analysis prompt | `@aibrd tasks` in Copilot Chat | — |
| **QA / Tester** | — | `aibrd: Generate Test Cases` | `aibrd tests` |
| **Release Manager** | — | `aibrd: Generate Release Notes` | `aibrd release v2.3.0` |
| **Scrum Master** | Sprint feed prompt | `aibrd: Generate Sprint Feed` | `aibrd sprint` |
| **Architect** | — | `aibrd: Derive API Contracts` | `aibrd api-contracts` |
| **Compliance Officer** | Compliance map prompt | `aibrd: Map Compliance Frameworks` | `aibrd compliance --fw GDPR` |
| **Product Owner** | — | receives PO Progress Report | receives `aibrd po-report` |
| **Explorer / Solo Dev** | ✅ Start here | — | `pip install -e . && aibrd init` |

---

## 🔒 Critical Reminder

**Option A prompts produce output that must be reviewed before committing.** The LLM may misclassify requirements, merge flows that should be separate, or miss edge cases in complex BRDs. Always:

1. Read the generated CONTEXT.md before committing
2. Resolve all items flagged in `ambiguity-report.md` with the business
3. Never silently accept IDs — if a BF or BR looks wrong, fix it before it becomes load-bearing in tests and release notes
4. The `registry.json` ID counter must never be edited manually — IDs are permanent once issued

---

## CI/CD — GitHub Actions

```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

Uses `GITHUB_TOKEN` + GitHub Models API — no separate API key required.

---

## Configuration (Option B)

```json
// .vscode/settings.json
{
  "aibrd.preferredModel": "claude-sonnet-4-6",
  "aibrd.maxChunkTokens": 6000,
  "aibrd.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

---

## Enterprise Rollout

See [`WORKING_PLAN.md`](WORKING_PLAN.md) for the 4-week phased rollout plan covering pilot team selection, toolchain integration, org-wide deployment, and success metrics.

---

## License

MIT — Author: Anirudh Yadav
