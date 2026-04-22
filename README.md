# aibrd

**BRD → Living Specification → Code Traceability**

aibrd is a VS Code extension that converts Business Requirements Documents (BRDs) into a version-controlled, living specification inside your repository — keeping the thread between what the business asked for and what got shipped, alive permanently.

No external API keys. No backend service. Runs entirely on **GitHub Copilot** via the `vscode.lm` API.

---

## The Problem

Most teams lose the thread between the BRD and the code within weeks of a project starting. Requirements get interpreted, partially implemented, or silently dropped. By the time a release ships, no one can confidently answer: *"Did we actually build what the business asked for?"*

aibrd keeps that thread alive — in the repo itself, versioned alongside the code.

---

## How It Works

```
BRD (PDF / Word / Markdown)
        ↓
  aibrd: Initialize
        ↓
  .aibrd/
  ├── CONTEXT.md          ← living spec, versioned in git
  ├── index.md            ← requirement traceability matrix
  ├── ambiguity-report.md ← vague terms flagged
  ├── conflict-report.md  ← contradicting rules flagged
  └── modules/            ← auto-detected domains (large projects)
        ↓
  PO brings new requirement → aibrd: Update → CONTEXT.md stays current
        ↓
  Dev uses @aibrd tasks   → knows exactly what to build
  QA uses aibrd: Tests    → test cases auto-generated
  Lead uses aibrd: Release → release notes mapped to requirement IDs
```

---

## Requirements

- VS Code 1.90+
- GitHub Copilot (Individual, Business, or Enterprise)
- GitHub Enterprise (for org-wide deployment)

---

## Installation

### Development
```bash
git clone https://github.com/anirudhyadav/aibrd.git
cd aibrd
npm install
# Press F5 in VS Code to launch Extension Development Host
```

### Org-wide Deployment
Package the extension as a VSIX and deploy via your org's managed VS Code extension pipeline:
```bash
npm install
npx vsce package
# Distribute aibrd-0.1.0.vsix via MDM or VS Code Server
```

---

## Commands

| Command | Who Uses It | What It Does |
|---|---|---|
| `aibrd: Initialize from BRD` | Tech Lead (once) | Parses PDF/Word/MD → generates full `.aibrd/` structure |
| `aibrd: Update with new requirement` | Lead Engineer | Adds PO requirement → appends to CONTEXT.md with new IDs |
| `aibrd: Generate Test Cases` | QA / Tester | Generates Given/When/Then test cases from CONTEXT.md |
| `aibrd: Generate Release Notes` | Lead / DevOps | Maps git diff to requirement IDs → release notes |
| `aibrd: Show Traceability Matrix` | Anyone | Refreshes the RTM tree view in the sidebar |
| `aibrd: Show Gap Report` | Dev / Lead | Checks open file against requirements for coverage gaps |

---

## Copilot Chat — @aibrd

Once initialized, use `@aibrd` directly in Copilot Chat:

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

---

## The `.aibrd/` Folder

aibrd writes all generated artifacts into `.aibrd/` at your workspace root. **Commit this folder to git** — it is the living specification for your project.

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

Flat vs modular mode is detected automatically from the BRD size and structure. Module names are inferred by the LLM from the BRD content — no manual input needed.

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

These IDs are referenced in PRs, test cases, release notes, and git commits — maintaining full traceability from requirement to code.

---

## CONTEXT.md Format

```markdown
# CONTEXT.md
_Module: payments | v1.3 | Updated: 2026-04-22_

## Actors
- **ACT-001**: Customer — End user initiating payments
- **ACT-002**: Payment Gateway — External payment processor

## Business Flows

### PAY-BF-001: Customer initiates payment
The customer selects items and proceeds to checkout.

**Steps:**
1. Customer selects payment method _(Customer)_
2. System validates card details _(Payment Gateway)_
3. Payment confirmed and order created

_Rules: PAY-BR-001, PAY-BR-002_
_AC: PAY-AC-001_

## Business Rules

### PAY-BR-001
Payment must complete within 30 seconds.
> Regulatory requirement per PSR 2023

### PAY-BR-002
Refunds are only permitted within 30 days of purchase.

## Acceptance Criteria

### PAY-AC-001
- **Given** a customer has items in cart
- **When** they submit a valid payment
- **Then** confirmation is shown within 5 seconds
_Flow: PAY-BF-001_

## Changelog
- 2026-04-22 v1.3: PAY-BR-003 added (compliance — PO via lead)
- 2026-04-01 v1.2: PAY-BF-001 updated (retry flow added)
```

---

## CI/CD — GitHub Actions

Add one line to any repo's workflow to enable automatic gap checking on every PR:

```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

The workflow uses `GITHUB_TOKEN` + GitHub Models API — no separate API key required. On each PR, it posts a gap analysis to the job summary showing which requirements may be impacted by the changes.

---

## Personas

| Role | How They Use aibrd |
|---|---|
| **Tech Lead** | Runs `Initialize` once per project. Runs `Update` when PO brings new requirements. |
| **PO / BA** | Works with Lead Engineer who runs `Update` on their behalf. Reviews CONTEXT.md for accuracy. |
| **Developer** | Uses `@aibrd tasks` to understand what to build. References requirement IDs in PRs. |
| **QA / Tester** | Runs `Generate Test Cases` to get Given/When/Then test cases per module. |
| **Release Manager** | Runs `Generate Release Notes` to map shipped code to requirement IDs. |

---

## Configuration

```json
// .vscode/settings.json or user settings
{
  "aibrd.preferredModel": "claude-sonnet-4-5",
  "aibrd.maxChunkTokens": 6000
}
```

| Setting | Default | Description |
|---|---|---|
| `aibrd.preferredModel` | `claude-sonnet-4-5` | Copilot model for BRD analysis |
| `aibrd.maxChunkTokens` | `6000` | Max tokens per BRD chunk (for large documents) |

---

## Architecture

```
aibrd/
├── src/
│   ├── extension.ts              # Entry point
│   ├── chat/                     # @aibrd Copilot Chat participant
│   ├── commands/                 # VS Code commands
│   ├── views/                    # Webview panels + tree views
│   ├── core/
│   │   ├── parsers/              # PDF, DOCX, Markdown
│   │   ├── extractors/           # Actors, flows, rules, AC, modules
│   │   ├── generators/           # CONTEXT.md, UAT, tests, RTM, reports
│   │   ├── analyzers/            # Gap detection, change impact
│   │   ├── registry.ts           # Stable ID management
│   │   └── models/               # TypeScript types
│   ├── llm/
│   │   ├── client.ts             # vscode.lm wrapper (no API key)
│   │   └── context_builder.ts    # Token-aware prompt construction
│   └── workspace/
│       ├── detector.ts           # Flat vs modular mode
│       ├── reader.ts             # Load relevant context per query
│       └── writer.ts             # Safe .aibrd/ file writes
└── .github/workflows/
    └── aibrd-reusable.yml        # Reusable CI gap check
```

**Key design principle:** `llm/client.ts` is the only file that touches the LLM. Every other file is pure logic — fully testable without Copilot.

---

## Onboarding a New Team

1. Export BRD from Confluence as PDF or Word
2. Open the project repo in VS Code
3. Run `aibrd: Initialize from BRD` → select the file
4. Review generated `.aibrd/` folder
5. Commit `.aibrd/` to git
6. Add the reusable workflow to CI
7. Share this README with the team

From that point, the spec lives in the repo and evolves with the code.

---

## Author
AnirudhYadav
