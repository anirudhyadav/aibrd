# AIBRD — AI Business Requirements & Decision Layer

> Convert BRDs into living specifications. Review every PR with a consistent rubric. Stress-test designs before committing. Resolve engineering deadlocks. All inside your existing Copilot workflow — no extra API keys.

---

## What AIBRD Does

AIBRD has two complementary layers that work together:

### Layer 1 — BRD to Living Specification
Converts Business Requirements Documents into version-controlled, traceable specifications that stay alive in your repo alongside the code.

### Layer 2 — Judgment on AI-Generated Code
Adds structured review, architectural rigor, and conflict resolution on top of Copilot, Claude Code, and Devin — giving your team three decision-support roles:

| Role | Purpose | When to Use |
|---|---|---|
| ⚖ **Judge** | Structured code review against your team's rubric | Every PR, security audits |
| 📐 **Advocate** | Stress-test proposals and generate Architecture Decision Records | Before any design commitment |
| 🤝 **Mediator** | Resolve sprint-blocking engineering disagreements | When discussions go circular |

---

## Three Delivery Paths

| | Option A — MD Templates | Option B — VS Code Extension | Option C — Python Library |
|---|---|---|---|
| **Setup** | Zero. Copy-paste markdown. | Install extension + GitHub Copilot | `pip install -e .` |
| **LLM** | Any — paste into Claude.ai, ChatGPT, Gemini, Copilot | GitHub Copilot (Claude / GPT-4o / Gemini auto-routed per role) | Anthropic / GitHub Models / OpenAI |
| **Best for** | Evaluation, air-gapped teams, any LLM preference | Org teams on GitHub Enterprise + Copilot | CI pipelines, personal repos, scripting |
| **BRD layer** | `prompts/` folder | `src/` extension (16 commands) | `pythonlibrary/` (15 CLI commands) |
| **Judgment layer** | `md-templates/` folder | `vscode-extension/` (6 modes) | — |
| **Docs** | [`prompts/README.md`](prompts/README.md) · [`md-templates/README.md`](md-templates/README.md) | [`PLAYBOOK.md`](PLAYBOOK.md) · [`vscode-extension/README.md`](vscode-extension/README.md) | [`pythonlibrary/PLAYBOOK.md`](pythonlibrary/PLAYBOOK.md) |

**Recommended path:** Start with Option A (both folders) to validate the value. Graduate to Option B once the team is on GitHub Enterprise + Copilot. Use Option C for CI automation.

---

## Repository Structure

```
aibrd/
│
├── README.md                              ← you are here
├── PLAYBOOK.md                            ← VS Code Extension full guide (BRD layer)
│
│  ── OPTION A: MD Templates ──────────────────────────────────────────────
│
├── prompts/                               ← BRD layer prompts (zero setup)
│   ├── README.md
│   ├── extract-requirements.md            ← BRD → actors / flows / rules / AC
│   ├── gap-analysis.md                    ← code file vs CONTEXT.md coverage
│   ├── sprint-feed.md                     ← CONTEXT.md → sprint tasks
│   ├── change-impact.md                   ← old BRD vs new BRD delta
│   └── compliance-map.md                  ← requirements vs GDPR/WCAG/HIPAA/SOX
│
├── md-templates/                          ← Judgment layer prompts (zero setup)
│   ├── README.md
│   ├── judge-review.md                    ← ⚖  code review with verdict
│   ├── advocate-adr.md                    ← 📐  architecture decision record
│   ├── advocate-devil.md                  ← 👿  stress-test before committing
│   ├── mediate-design.md                  ← 🤝  resolve design conflicts
│   └── team_standards.md                  ← edit this per team
│
│  ── OPTION B: VS Code Extension ─────────────────────────────────────────
│
├── src/                                   ← BRD layer extension (TypeScript)
│   ├── extension.ts                       ← 16 commands + @aibrd chat participant
│   ├── chat/                              ← @aibrd Copilot Chat handlers
│   ├── commands/                          ← 16 VS Code commands
│   ├── core/                              ← parsers, extractors, generators, analyzers
│   └── llm/                              ← vscode.lm wrapper (no API key)
│
├── vscode-extension/                      ← Judgment layer extension (TypeScript)
│   ├── README.md
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── extension.ts                   ← @judge @advocate @mediator + multi-LLM routing
│       └── prompts.ts                     ← 6 baked-in system prompts
│
│  ── OPTION C: Python Library ────────────────────────────────────────────
│
├── pythonlibrary/                         ← BRD layer Python CLI + library
│   ├── aibrd/
│   │   ├── cli.py                         ← 15 CLI commands
│   │   ├── llm/client.py                  ← Anthropic / GitHub Models / OpenAI
│   │   ├── parsers/                       ← PDF, DOCX, Markdown, Confluence
│   │   ├── extractors/                    ← actors, flows, rules, AC, modules
│   │   ├── generators/                    ← CONTEXT.md, tests, RTM, sprint, API, PO
│   │   └── analyzers/                     ← gap, change impact, staleness, test linkage
│   └── PLAYBOOK.md
│
│  ── INFRASTRUCTURE ──────────────────────────────────────────────────────
│
├── .github/workflows/aibrd-reusable.yml   ← reusable CI gap check
├── scripts/build_ppt.py
└── README_bkp.md                          ← previous README (kept for reference)
```

---

## Quick Start

### BRD Layer — Option A (5 minutes)
```
1. Open prompts/extract-requirements.md
2. Replace [PASTE YOUR BRD TEXT HERE] with your BRD content
3. Paste into any LLM (Claude, ChatGPT, Copilot Chat, Gemini)
4. Copy output into .aibrd/CONTEXT.md in your repo and commit it
```

### Judgment Layer — Option A (5 minutes)
```
1. Open md-templates/judge-review.md
2. Paste your code or PR diff after the divider line
3. Paste into any LLM
4. Get APPROVE / REQUEST_CHANGES / BLOCK + scored rubric
```
→ Full guide: [md-templates/README.md](md-templates/README.md)

### BRD + Judgment Layer — Option B (15 minutes each)

**BRD extension (src/):**
```bash
npm install
# Press F5 in VS Code → Extension Development Host
# Command Palette → aibrd: Initialize from BRD → select PDF or Word file
```

**Judgment extension (vscode-extension/):**
```bash
cd vscode-extension
npm install && npm run compile && npm run package
code --install-extension aibrd-0.1.0.vsix
# In Copilot Chat: @judge /review  @advocate /devil  @mediator /design
```
→ Full guide: [vscode-extension/README.md](vscode-extension/README.md)

### BRD Layer — Option C (Python)
```bash
cd pythonlibrary && pip install -e .
export GITHUB_TOKEN=ghp_...
aibrd init ./my-brd.pdf
```

---

## The Six Judgment Modes

| Mode | Trigger | Output |
|---|---|---|
| **Judge: Review** | Every PR | `APPROVE / REQUEST_CHANGES / BLOCK` + scored rubric |
| **Judge: Security** | Auth, payments, data access code | `PASS / WARN / FAIL` + OWASP mapping |
| **Advocate: Devil** | Before any design commitment | Risk score + `PROCEED / REVISE / RECONSIDER` gate |
| **Advocate: ADR** | After devil's advocate says PROCEED | Full Architecture Decision Record |
| **Mediator: Design** | Sprint-blocking disagreement | Common ground + synthesis + experiment |
| **Mediator: Deps** | Dependency version conflict | Root cause + minimal version pins |

### Multi-LLM Routing (Option B — vscode-extension/)

The judgment extension automatically routes each mode to its best-fit model using whatever is available in your Copilot plan. No configuration needed.

| Mode | First choice | Falls back to | Then tries |
|---|---|---|---|
| Judge: Review | Claude | GPT-4o | Gemini |
| Judge: Security | Claude | GPT-4o | Gemini |
| Advocate: ADR | GPT-4o | Claude | Gemini |
| Advocate: Devil | Claude | GPT-4o | Gemini |
| Mediator: Design | Claude | GPT-4o | Gemini |
| Mediator: Deps | GPT-4o | Claude | Gemini |

If your org only has one model available, all modes fall back to it gracefully.

---

## End-to-End Workflow

```
BRD arrives
  └─→ [BRD layer] aibrd: Initialize from BRD
        └─→ generates .aibrd/CONTEXT.md + test-cases.md + RTM

Dev implements feature → PR submitted
  └─→ [Judgment layer] @judge /review         ← catch code quality issues
        └─→ @judge /security                  ← on auth/payment/data paths

Design needed before implementation
  └─→ @advocate /devil  <proposal>            ← stress-test before writing anything
        ├─→ PROCEED → @advocate /adr          ← generate formal ADR
        ├─→ REVISE  → fix → re-run devil      
        └─→ RECONSIDER → escalate to arch review

Sprint blocked by disagreement
  └─→ @mediator /design                       ← synthesize + suggest experiment

Dependency conflict
  └─→ @mediator /deps                         ← resolve version pins

Merge approved
  └─→ [BRD layer] aibrd gap detector checks PR against BRD requirements
```

---

## Team Customization

Edit **`md-templates/team_standards.md`** (Option A) or the rubric section of **`vscode-extension/src/prompts.ts`** (Option B) with your team's specific rules. The defaults cover 20 rules across 5 categories (quality, security, testing, architecture, process).

**Override rate health check:**

| Rate | Meaning | Action |
|---|---|---|
| < 5% | Rubber-stamping or rubric too lenient | Tighten rubric or check if tool is used on real code |
| 10–25% | Healthy — rubric aligned with team judgment | No action |
| > 30% | Rubric out of step | Recalibrate — loosen or remove rules teams consistently override |

---

## VS Code Commands — BRD Layer (src/)

| Command | Who | What |
|---|---|---|
| `aibrd: Initialize from BRD` | Tech Lead | PDF/Word/MD → full `.aibrd/` |
| `aibrd: Update with new requirement` | Lead Engineer | Append PO requirement to CONTEXT.md |
| `aibrd: Generate Test Cases` | QA | Given/When/Then from CONTEXT.md |
| `aibrd: Generate Release Notes` | Release Manager | git diff → requirement ID mapped notes |
| `aibrd: Show Traceability Matrix` | Anyone | RTM tree view |
| `aibrd: Show Gap Report` | Dev / Lead | Open file vs requirements coverage |
| `aibrd: Analyse Change Impact` | Architect | Diff two BRD versions |
| `aibrd: Validate CONTEXT.md` | Lead | Structure + cross-ref check |
| `aibrd: Draft Pull Request Description` | Dev | git diff + requirements → traceable PR |
| `aibrd: Generate Sprint Feed` | Scrum Master | CONTEXT.md → TASK-NNN with AC |
| `aibrd: Derive API Contracts` | Architect | Business flows → OpenAPI 3.0 |
| `aibrd: Generate PO Progress Report` | PO | Plain-English built-vs-asked report |
| `aibrd: Map Compliance Frameworks` | Compliance | Tag to GDPR/WCAG/HIPAA/SOX/PCI-DSS |
| `aibrd: Ingest from Confluence` | Lead | Confluence page → CONTEXT.md |
| `aibrd: Check Requirement Staleness` | Lead | BF-XXX IDs vs git log |
| `aibrd: Link Requirements to Test Files` | QA | Scan test files for ID mentions |

**Chat (`@aibrd`):**
```
@aibrd what is BF-003?
@aibrd tasks
@aibrd coverage
@aibrd rtm
```

---

## VS Code Commands — Judgment Layer (vscode-extension/)

```
In Copilot Chat panel:

@judge /review #file:src/payments/processor.ts
@judge /security #file:src/auth/token.ts

@advocate /devil I want to replace our message queue with direct HTTP calls
@advocate /adr   [paste the proposal that passed devil's advocate]

@mediator /design
  Position A: use Redis for session storage (fast, battle-tested)
  Position B: use DynamoDB (already in infra, serverless)
  Constraint: must survive a regional outage

@mediator /deps  npm ls shows conflict: react-query@4 vs tanstack-query@5
```

---

## Python CLI — BRD Layer (pythonlibrary/)

```bash
aibrd init ./docs/brd.pdf             # initialize from BRD
aibrd update "new requirement text"   # append PO requirement
aibrd tests                           # generate test cases
aibrd gaps src/payments.py            # check file coverage
aibrd release v2.3.0                  # generate release notes
aibrd validate                        # validate .aibrd/ integrity
aibrd pr-draft --base main            # draft traceable PR description
aibrd change-impact ./brd-v2.pdf      # analyse BRD change impact
aibrd sprint                          # generate sprint tasks
aibrd api-contracts --format openapi  # derive OpenAPI spec
aibrd po-report v2.3.0                # plain-English PO report
aibrd compliance --fw GDPR --fw HIPAA # compliance mapping
aibrd confluence --url ...            # ingest from Confluence
aibrd stale                           # staleness report
aibrd test-linkage                    # test file coverage report
```

---

## Configuration

**BRD extension (Option B):**
```json
// .vscode/settings.json
{
  "aibrd.preferredModel": "claude-sonnet-4-6",
  "aibrd.maxChunkTokens": 6000,
  "aibrd.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

**CI/CD:**
```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

---

## Requirements

| | Option A | Option B (src/) | Option B (vscode-extension/) | Option C |
|---|---|---|---|---|
| GitHub Copilot | Optional | Required | Required | No |
| VS Code | Any | 1.93+ | 1.93+ | No |
| Node.js | No | 18+ | 18+ | No |
| Python | No | No | No | 3.9+ |
| API keys | None | None | None | One provider |

---

## Multi-Team Rollout

See [ROLLOUT_PLAN.md](ROLLOUT_PLAN.md) for the phased rollout guide covering pilot team selection, org-wide deployment via internal config repo, team customization, and success metrics.

---

## The `.aibrd/` Folder (BRD Layer Output)

Both `src/` and `pythonlibrary/` write to the same format — commit `.aibrd/` to git.

```
.aibrd/
├── registry.json              # ID counter — never reused
├── CONTEXT.md                 # Living spec: actors, flows, rules, AC
├── index.md                   # Traceability matrix
├── ambiguity-report.md
├── conflict-report.md
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

## Important: Review Before Committing

Option A prompt output must be reviewed before committing. The LLM may misclassify requirements, merge flows that should be separate, or miss edge cases in complex BRDs.

1. Read generated CONTEXT.md before committing
2. Resolve all items in `ambiguity-report.md` with the business
3. Never silently accept IDs — if a BF or BR looks wrong, fix it before it becomes load-bearing in tests and release notes
4. The `registry.json` ID counter must never be edited manually

---

## License

MIT — Author: Anirudh Yadav
