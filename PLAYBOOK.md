# aibrd Playbook — VS Code Extension

**Practical guide for every role — from onboarding to release.**

This playbook covers the **VS Code Extension** (GitHub Enterprise + Copilot). For the standalone Python CLI and library, see [pythonlibrary/PLAYBOOK.md](pythonlibrary/PLAYBOOK.md).

---

## Which Tool Should I Use?

| Situation | Use |
|---|---|
| Org team on GitHub Enterprise with Copilot | **This playbook** — VS Code Extension |
| Personal repo, any machine, any LLM key | [Python Library Playbook](pythonlibrary/PLAYBOOK.md) |
| CI/CD pipeline, scripting, automation | [Python Library Playbook](pythonlibrary/PLAYBOOK.md) |
| Exploring aibrd without VS Code | [Python Library Playbook](pythonlibrary/PLAYBOOK.md) |

Both tools produce the same `.aibrd/` output format and are fully compatible on the same repo.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Tech Lead — Project Onboarding](#2-tech-lead--project-onboarding)
3. [Lead Engineer — Updating Requirements](#3-lead-engineer--updating-requirements)
4. [Developer — Daily Usage](#4-developer--daily-usage)
5. [QA / Tester — Generating Test Cases](#5-qa--tester--generating-test-cases)
6. [Release Manager — Release Notes](#6-release-manager--release-notes)
7. [Quality & Analysis Commands](#7-quality--analysis-commands)
8. [Delivery Tools](#8-delivery-tools)
9. [Ingestion & Traceability](#9-ingestion--traceability)
10. [Understanding the .aibrd/ Folder](#10-understanding-the-aibrd-folder)
11. [Stable ID Reference](#11-stable-id-reference)
12. [CONTEXT.md Structure](#12-contextmd-structure)
13. [Copilot Chat — @aibrd Reference](#13-copilot-chat--aibrd-reference)
14. [CI/CD — GitHub Actions Setup](#14-cicd--github-actions-setup)
15. [Configuration Reference](#15-configuration-reference)
16. [Troubleshooting](#16-troubleshooting)
17. [Quick Reference Card](#17-quick-reference-card)

---

## 1. Prerequisites

Before using aibrd, ensure the following:

| Requirement | Check |
|---|---|
| VS Code 1.90+ installed | `code --version` |
| GitHub Copilot extension active | Copilot icon visible in status bar |
| Copilot signed in with org account | Settings → Copilot → Signed in |
| aibrd extension installed | Extensions panel → search "aibrd" |
| Workspace folder open in VS Code | File → Open Folder |
| Project is a git repository | `.git/` folder exists at root |

**aibrd uses your existing Copilot license. No additional API keys or accounts needed.**

---

## 2. Tech Lead — Project Onboarding

This is a one-time step per project. Run it once, commit the output, and your team has a living spec.

### Step 1 — Prepare the BRD

Export your BRD from Confluence/SharePoint in one of these formats:

| Format | Notes |
|---|---|
| `.pdf` | Best for finalized documents |
| `.docx` / `.doc` | Best for editable Word documents |
| `.md` | If already in Markdown |
| Confluence page | Use `aibrd: Ingest from Confluence` directly (no file needed) |

### Step 2 — Run Initialize

1. Open the project repo in VS Code
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Type and select: **`aibrd: Initialize from BRD`**
4. A file picker opens — select your BRD file
5. A progress notification appears while aibrd processes the document

**What happens during initialization:**

```
Parse BRD file
    ↓
Detect if flat (small) or modular (large) project
    ↓  [modular only]
Detect business domains → auto-generate module names + IDs
    ↓
Extract: actors · business flows · business rules · acceptance criteria
    ↓
Assign stable IDs to every item (e.g. PAY-BF-001, AUTH-BR-003)
    ↓
Generate:
  CONTEXT.md            ← structured living spec
  index.md              ← traceability matrix
  ambiguity-report.md   ← vague terms flagged
  conflict-report.md    ← contradicting rules flagged
    ↓
Show results panel
```

### Step 3 — Review Generated Files

After initialization, open `.aibrd/` and review:

- **`CONTEXT.md`** (or `modules/<name>/CONTEXT.md`) — check that actors, flows, rules, and AC are correctly extracted
- **`ambiguity-report.md`** — resolve flagged terms with the PO before development starts
- **`conflict-report.md`** — escalate conflicting rules to the PO immediately

Run a validation pass:

**Command Palette → `aibrd: Validate CONTEXT.md`**

This checks cross-references, duplicate IDs, and missing changelog entries before anything is committed.

### Step 4 — Commit to Git

```bash
git add .aibrd/
git commit -m "feat: initialize aibrd living spec from BRD v1.0"
```

The `.aibrd/` folder is now version-controlled alongside your code. Every team member has access to the spec.

### Step 5 — Add to CI

Add the reusable workflow to your repo (see [Section 14](#14-cicd--github-actions-setup)).

---

## 3. Lead Engineer — Updating Requirements

When the PO brings new requirements (via email, Jira, Confluence, or verbal), the Lead Engineer is responsible for keeping CONTEXT.md current.

### Running the Update Command

1. Collect the requirement from the PO in plain text
2. Open Command Palette → **`aibrd: Update with new requirement`**
3. A text input box appears — paste or type the requirement
4. aibrd will:
   - Determine which module the requirement belongs to (modular projects)
   - Create a new module automatically if it's a new domain
   - Extract flows, rules, and AC from the text
   - Assign new stable IDs (continuing from the registry)
   - Append to the correct CONTEXT.md
   - Add a changelog entry with the date and version

### Analysing Change Impact Before Updating

When a significantly revised BRD arrives, run **`aibrd: Analyse Change Impact`** first:

1. Command Palette → **`aibrd: Analyse Change Impact`**
2. File picker opens — select the new BRD version
3. aibrd compares it to the existing CONTEXT.md and produces a report:
   - Requirements that have changed scope
   - Requirements that appear to have been removed
   - Entirely new requirements not yet in the spec

Review `.aibrd/change-impact-report.md` with the PO before committing any updates.

### Example Input (Update Command)

```
Users must be able to reset their password using an SMS OTP.
The OTP must expire within 60 seconds. A maximum of 3 attempts
are allowed before the account is temporarily locked for 15 minutes.
```

### Example Output (appended to auth/CONTEXT.md)

```markdown
### AUTH-BF-004: Password reset via SMS OTP
Users initiate password reset by requesting an OTP to their registered mobile number.

### AUTH-BR-007
OTP expires within 60 seconds of generation.

### AUTH-BR-008
Maximum 3 failed OTP attempts before account locks for 15 minutes.

### AUTH-AC-009
- **Given** a user requests a password reset
- **When** they submit a valid OTP within 60 seconds
- **Then** they are prompted to set a new password

- 2026-04-23 v1.4: AUTH-BF-004, AUTH-BR-007, AUTH-BR-008, AUTH-AC-009 added (PO via lead)
```

### Commit the Update

```bash
git add .aibrd/
git commit -m "spec(auth): add SMS OTP password reset — AUTH-BF-004"
```

**Convention:** Reference the requirement ID in your commit message. This creates a permanent audit trail.

---

## 4. Developer — Daily Usage

### Using @aibrd in Copilot Chat

Open Copilot Chat in VS Code (`Ctrl+Shift+I` / `Cmd+Shift+I`) and mention `@aibrd`:

#### Get details on a specific requirement

```
@aibrd what is PAY-BF-003?
```
Returns: full flow description, steps, related rules, and acceptance criteria.

```
@aibrd explain AUTH-BR-007
```
Returns: the rule, its rationale, and which flows it applies to.

#### Find out what to build

```
@aibrd tasks
```
Returns: a prioritized list of developer tasks derived from CONTEXT.md, with the requirement IDs to satisfy for each task.

```
@aibrd tasks for the payments module
```
Returns: tasks scoped to the payments domain only.

#### Ask free-form questions

```
@aibrd what are the rules around refunds?
@aibrd which flows involve the Payment Gateway actor?
@aibrd are there any rules about timeouts?
```

### Check Coverage on Your Current File

1. Open the file you are working on
2. Optionally select a block of code
3. Open Command Palette → **`aibrd: Show Gap Report`**

Or in Copilot Chat:
```
@aibrd coverage
```

Returns a gap report showing which requirements are covered, partially covered, or missing in the selected code.

### Auto-generate Your PR Description

Before opening a pull request:

1. Command Palette → **`aibrd: Draft Pull Request Description`**
2. aibrd reads the git diff against `main`, maps it to requirement IDs, and generates:
   - **What Changed** — plain English bullet list
   - **Requirements Covered** — traced BF-XXX, BR-XXX, AC-XXX IDs
   - **Test Coverage** — which test files cover the changes
   - **Notes for Reviewer** — trade-offs and edge cases

Copy the output into your PR description.

### Using the RTM Tree View

The **aibrd Traceability** panel appears in the Explorer sidebar. It shows:
- All modules (modular projects)
- All requirements under each module
- Click any requirement to open its CONTEXT.md at that line

Refresh it with: Command Palette → **`aibrd: Show Traceability Matrix`**

---

## 5. QA / Tester — Generating Test Cases

### Run Generate Test Cases

1. Open Command Palette → **`aibrd: Generate Test Cases`**
2. For modular projects, select a module from the dropdown (or "All modules")
3. Test cases are written to `.aibrd/modules/<slug>/tests/test-cases.md`

### Output Format

Each test case is generated in Gherkin format and traces back to its source ID:

```markdown
## PAY-TC-001
_Traces: PAY-AC-001, PAY-BF-001_

```gherkin
Scenario: Customer submits valid payment
  Given a customer has items in cart
  When they submit a valid payment method
  Then confirmation is shown within 5 seconds
```

## PAY-TC-002-boundary
_Traces: PAY-BR-001_

```gherkin
Scenario: Verify rule — Payment must complete within 30 seconds
  Given the system is operational
  When a payment is initiated
  Then the rule is enforced: Payment must complete within 30 seconds
```
```

### Check Which Requirements Have Test File Coverage

After writing test files, run:

**Command Palette → `aibrd: Link Requirements to Test Files`**

aibrd scans all test files in the workspace for requirement ID mentions (`// aibrd: PAY-BF-001` or any string occurrence) and produces a report showing:
- Which requirements have test file references (✅ Covered)
- Which requirements have no test file yet (❌ Not Covered)
- Overall coverage percentage

**Tip:** Add `// aibrd: BF-XXX` comments in your test files to improve traceability detection.

---

## 6. Release Manager — Release Notes

### Run Generate Release Notes

1. Open Command Palette → **`aibrd: Generate Release Notes`**
2. Enter the release version (e.g. `v2.3.0`)
3. Enter the git range to diff (e.g. `main...release/v2.3` or `HEAD~20..HEAD`)
4. aibrd reads the git diff, maps changes to requirement IDs, and generates release notes

### Output Format

```markdown
# Release Notes — v2.3.0
_RN-004 | Generated: 2026-04-23_

## Summary
- Payment refund flow (PAY-BF-003) fully implemented
- SMS OTP password reset (AUTH-BF-004) shipped
- 2 known gaps remain (see below)

## What Changed

### PAY-BF-003: Refund Initiation
Customers can now initiate refunds within 30 days of purchase.
Satisfies: PAY-BR-005, PAY-BR-006, PAY-AC-008

## Known Gaps
- NOTIF-BF-002: Email notification on refund — not yet implemented
```

Saved to: `.aibrd/releases/v2.3.0.md`

### Generate a PO-Friendly Report

For sharing with the Product Owner (who doesn't read requirement IDs):

1. Command Palette → **`aibrd: Generate PO Progress Report`**
2. Enter the version and git range
3. A plain-English report is produced — no requirement IDs visible, no technical jargon

Sections:
- **What Was Asked For** — plain English summary of requirements
- **What Was Built** — plain English summary of git changes
- **Still To Do** — outstanding items
- **Risks & Notes** — anything the PO should know before sign-off

Saved to: `.aibrd/releases/po-report-v2.3.0.md`

---

## 7. Quality & Analysis Commands

### Validate CONTEXT.md

**Command Palette → `aibrd: Validate CONTEXT.md`**

Checks without LLM (instant, pure logic):
- `registry.json` exists and is readable
- `CONTEXT.md` or module files exist
- All ID cross-references (e.g. `_Rules: BR-001_`) resolve to real IDs
- No duplicate IDs across modules
- Changelog section present

Run this before any commit. Exits with a pass/fail message and saves a report.

### Analyse Change Impact

**Command Palette → `aibrd: Analyse Change Impact`**

Select a new BRD file to compare against the current CONTEXT.md. Produces `.aibrd/change-impact-report.md` with:
- Changed requirements (scope drift)
- Removed requirements (potential deletions)
- New requirements not yet registered

### Check Requirement Staleness

**Command Palette → `aibrd: Check Requirement Staleness`**

Cross-references each BF-XXX ID against `git log` to find how many days have passed since any source file referencing that ID was last modified.

| Threshold | Verdict |
|---|---|
| < 14 days since last code touch | 🟢 Ok |
| 14–30 days | 🟡 Drifting |
| > 30 days | 🔴 Stale |

Saved to: `.aibrd/staleness-report.md`

**Use case:** monthly spec hygiene review. Stale requirements may mean dropped scope or unreferenced code.

---

## 8. Delivery Tools

### Generate Sprint Feed

**Command Palette → `aibrd: Generate Sprint Feed`**

For modular projects, select a module (or "All modules"). aibrd reads CONTEXT.md and asks the LLM to generate developer sprint tasks with:

- `TASK-001` format ID
- Verb-first action title
- Story point estimate (Fibonacci: 1, 2, 3, 5, 8, 13)
- Priority (high / medium / low)
- Which requirement IDs it covers
- Acceptance criteria checklist (`- [ ]`)

Output grouped by priority with a summary table. Saved to `.aibrd/sprint-feed.md`.

**Example output:**

```markdown
## 🔴 High Priority

### TASK-001: Implement payment initiation flow
**Story Points:** 5
**Module:** payments
**Traces:** PAY-BF-001, PAY-BR-002
**Acceptance Criteria:**
- [ ] Payment completes within 30 seconds
- [ ] Error shown on invalid card details
```

### Derive API Contracts

**Command Palette → `aibrd: Derive API Contracts`**

Select a module and output format:
- **OpenAPI 3.0 (YAML)** — machine-readable, import into Swagger/Postman
- **Markdown** — human-readable for review

aibrd reads business flows and infers likely REST endpoints, request bodies, and response codes.

Output saved to `.aibrd/<module>-openapi.yaml` or `.aibrd/<module>-api-contracts.md`.

**Example output (Markdown):**

```markdown
## `POST /api/v1/payments`
**Initiate a payment**
_Traces: PAY-BF-001_

**Request Body:**
```json
{ "amount": "number", "currency": "string", "paymentMethod": "string" }
```

**Responses:**
- `200`: Payment accepted
- `400`: Invalid payload
- `402`: Insufficient funds
```

> These are AI-derived drafts — always review with the engineering team before implementation.

### Map Compliance Frameworks

**Command Palette → `aibrd: Map Compliance Frameworks`**

Select one or more frameworks from the multi-select picker:
`GDPR` · `WCAG` · `HIPAA` · `SOX` · `PCI-DSS` · `ISO27001`

aibrd scans all requirements and flags those with genuine compliance relevance, with:
- The specific clause (e.g. `GDPR Art. 17 — Right to erasure`)
- Why it applies (rationale)
- Risk level: 🔴 High / 🟡 Medium / 🟢 Low
- A dedicated **High Risk Items — Action Required** section

Saved to: `.aibrd/compliance-map.md`

> Auto-generated mapping. Always validate with your compliance team before submission.

---

## 9. Ingestion & Traceability

### Ingest from Confluence

**Command Palette → `aibrd: Ingest from Confluence`**

Bypasses the file export step entirely — fetch the BRD directly from Confluence:

1. Enter your Confluence base URL (e.g. `https://yourorg.atlassian.net`)
2. Enter the space key (e.g. `ENG`)
3. Enter the page title (exact match)
4. Enter your API token (stored in memory only — never written to disk)
5. Enter your email (Atlassian Cloud only — leave blank for Server/DC)

aibrd fetches the page and its direct child pages, strips HTML, and runs the full initialization pipeline. Module detection and ID assignment happen the same as with file-based init.

**Pre-fill the base URL** in settings to skip step 1 each time:
```json
{ "aibrd.confluenceBaseUrl": "https://yourorg.atlassian.net" }
```

### Link Requirements to Test Files

**Command Palette → `aibrd: Link Requirements to Test Files`**

Scans all test files (`*.test.ts`, `*.spec.py`, `*Test.java`, `*_test.go`, etc.) in the workspace for any occurrence of a requirement ID (BF-XXX, AC-XXX, TC-XXX).

Output includes:
- Coverage percentage
- ✅ Covered requirements with which test files reference them
- ❌ Uncovered requirements
- Recommended actions

Saved to: `.aibrd/test-linkage-report.md`

**To improve detection**, add inline comments in your test files:
```typescript
// aibrd: PAY-BF-001
it('should process payment within 30 seconds', () => { ... })
```
```python
# aibrd: AUTH-AC-009
def test_sms_otp_password_reset(): ...
```

---

## 10. Understanding the .aibrd/ Folder

### Flat Mode (small projects)

Detected automatically when the BRD has fewer than 5 major sections or fewer than 2000 words.

```
.aibrd/
├── registry.json           # ID counter — source of truth for all IDs
├── CONTEXT.md              # Single living spec: actors, flows, rules, AC
├── index.md                # Traceability matrix
├── ambiguity-report.md     # Vague terms detected at init time
├── conflict-report.md      # Conflicting rules detected at init time
├── change-impact-report.md # Generated by: Analyse Change Impact
├── compliance-map.md       # Generated by: Map Compliance Frameworks
├── sprint-feed.md          # Generated by: Generate Sprint Feed
├── staleness-report.md     # Generated by: Check Requirement Staleness
├── test-linkage-report.md  # Generated by: Link Requirements to Test Files
├── openapi.yaml            # Generated by: Derive API Contracts (OpenAPI)
├── api-contracts.md        # Generated by: Derive API Contracts (Markdown)
├── tests/
│   └── test-cases.md
└── releases/
    ├── v1.0.md
    └── po-report-v1.0.md
```

### Modular Mode (large projects)

Detected automatically when the BRD is large and multi-domain. Module names are inferred from the BRD content by the LLM.

```
.aibrd/
├── registry.json
├── index.md
├── ambiguity-report.md
├── conflict-report.md
├── compliance-map.md        # across all modules
├── sprint-feed.md           # across all modules
├── staleness-report.md      # across all modules
├── test-linkage-report.md   # across all modules
├── modules/
│   ├── payments/
│   │   ├── CONTEXT.md       # PAY-BF-001, PAY-BR-001, PAY-AC-001 ...
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

### registry.json

The ID registry is the most critical file. **Never edit it manually.**

```json
{
  "mode": "modular",
  "modules": {
    "payments": {
      "displayName": "Payment Processing",
      "prefix": "PAY",
      "counters": { "BF": 12, "BR": 24, "AC": 18, "FT": 3, "TC": 31, "RN": 2 }
    },
    "auth": {
      "displayName": "User Authentication",
      "prefix": "AUTH",
      "counters": { "BF": 5, "BR": 8, "AC": 6, "FT": 1, "TC": 11, "RN": 1 }
    }
  },
  "shared": { "ACT": 5, "GBR": 3 }
}
```

- Counters only go up — IDs are never reused even if a requirement is deleted
- Module names and prefixes are assigned at first detection and never change
- New modules are appended automatically by `aibrd: Update`

---

## 11. Stable ID Reference

### ID Format

| Project Type | Format | Example |
|---|---|---|
| Small / flat | `TYPE-NNN` | `BF-001` |
| Large / modular | `PREFIX-TYPE-NNN` | `PAY-BF-012` |
| Global actors | `ACT-NNN` | `ACT-003` |
| Global rules | `GBR-NNN` | `GBR-001` |

### Type Reference

| Type | Full Name | Generated By |
|---|---|---|
| `ACT` | Actor | `aibrd: Init` |
| `BF` | Business Flow | `aibrd: Init` / `aibrd: Update` |
| `BR` | Business Rule | `aibrd: Init` / `aibrd: Update` |
| `AC` | Acceptance Criteria | `aibrd: Init` / `aibrd: Update` |
| `FT` | Feature | `aibrd: Init` |
| `TC` | Test Case | `aibrd: Generate Test Cases` |
| `RN` | Release Note | `aibrd: Generate Release Notes` |
| `GBR` | Global Business Rule | `aibrd: Init` (shared/) |

### Module Prefix Derivation

Prefixes are derived deterministically from the module slug:

| Module Name | Slug | Prefix |
|---|---|---|
| Payment Processing | `payments` | `PAY` |
| User Authentication | `auth` | `AUTH` |
| Notifications | `notifications` | `NOTIF` |
| User Management | `user-management` | `USR` |
| Risk & Compliance | `risk-compliance` | `RIS` |

If two modules would produce the same prefix, a number suffix is appended (`PAY2`).

---

## 12. CONTEXT.md Structure

Every CONTEXT.md follows this structure:

```markdown
# CONTEXT.md
_[Module: slug |] vX.Y | Updated: YYYY-MM-DD_

## Actors
- **ACT-001**: Name — description

## Business Flows

### [PREFIX-]BF-NNN: Flow Name
Description of the end-to-end process.

**Steps:**
1. Step description _(Actor)_
2. Step description

_Rules: BR-001, BR-002_
_AC: AC-001_

## Business Rules

### [PREFIX-]BR-NNN
Rule description.
> Rationale (if available)

_Flows: BF-001_

## Acceptance Criteria

### [PREFIX-]AC-NNN
- **Given** precondition
- **When** action
- **Then** expected outcome
_Flow: BF-001_
_Rules: BR-001_

## Changelog
- YYYY-MM-DD vX.Y: Description of change (source)
```

---

## 13. Copilot Chat — @aibrd Reference

### Full Command Reference

| Chat Input | Handler | What It Returns |
|---|---|---|
| `@aibrd help` | — | Lists all available commands |
| `@aibrd <ID>` | analyze | Details for that requirement |
| `@aibrd what is <ID>` | analyze | Details for that requirement |
| `@aibrd <any question>` | analyze | Answer from CONTEXT.md |
| `@aibrd tasks` | tasks | Dev task list from all requirements |
| `@aibrd tasks for <module>` | tasks | Dev tasks scoped to a module |
| `@aibrd coverage` | coverage | Gap report for open/selected code |
| `@aibrd rtm` | rtm | Full traceability matrix |

### Context Loading Strategy

aibrd is token-aware. It never dumps the entire `.aibrd/` into the prompt. Instead:

- **Single ID query** (`@aibrd PAY-BF-003`) → loads only the relevant module's CONTEXT.md
- **Cross-module query** → loads `index.md` + `shared/` + relevant module summaries
- **Coverage check** → loads context relevant to the open file's path/module
- **Tasks** → loads the full RTM from `index.md` + relevant CONTEXT files

---

## 14. CI/CD — GitHub Actions Setup

### Adding to a Repo

In any repo that has a `.aibrd/` folder, add this to your PR workflow:

```yaml
# .github/workflows/pr-check.yml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  aibrd-gap-check:
    uses: YOUR_ORG/aibrd/.github/workflows/aibrd-reusable.yml@main
    with:
      aibrd_dir: '.aibrd'   # optional, default is .aibrd
```

Replace `YOUR_ORG` with your GitHub organization name.

### What the Workflow Does

On every PR:

1. Checks that `.aibrd/registry.json` exists (skips gracefully if not initialized)
2. Gets the list of changed files against the base branch
3. Calls GitHub Models API (`GITHUB_TOKEN` — no extra key needed) with:
   - The requirement traceability from `index.md`
   - The list of changed files
4. Posts a gap analysis to the GitHub Actions job summary

### Viewing Results

In your PR → Actions tab → `aibrd Gap Check` job → Summary tab.

---

## 15. Configuration Reference

Set these in `.vscode/settings.json` (project-level) or user settings (global):

```json
{
  "aibrd.preferredModel": "claude-sonnet-4-5",
  "aibrd.maxChunkTokens": 6000,
  "aibrd.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `aibrd.preferredModel` | string | `claude-sonnet-4-5` | Copilot model ID to prefer. Falls back to any Claude model, then any available model. |
| `aibrd.maxChunkTokens` | number | `6000` | Max tokens per BRD chunk. Lower this if you hit context errors. |
| `aibrd.confluenceBaseUrl` | string | `""` | Pre-fill base URL for Confluence ingestion. |

### Model Options (Copilot Enterprise)

| Model | ID | Best For |
|---|---|---|
| Claude Sonnet 4.5 | `claude-sonnet-4-5` | Default — good balance of speed and quality |
| Claude Opus 4.7 | `claude-opus-4-7` | Complex BRDs with ambiguous language |
| GPT-4o | `gpt-4o` | Alternative if Claude unavailable |
| Gemini | `gemini-*` | Alternative fallback |

---

## 16. Troubleshooting

### "No Copilot LLM models available"

- Ensure GitHub Copilot extension is installed and you are signed in
- Check that your org license includes Copilot access for your account
- Try: VS Code → Command Palette → `GitHub Copilot: Sign In`

### "No workspace folder open"

- Open a folder in VS Code before running any aibrd command
- File → Open Folder → select your project root

### aibrd: Initialize produces empty or sparse output

- The BRD may be scanned (image-based PDF). Export from Confluence as a text-based PDF
- Try exporting as `.docx` instead — Word format preserves text reliably
- Use `aibrd: Ingest from Confluence` to bypass the file export entirely

### Confluence ingestion fails with 401 / 403

- For Atlassian Cloud: your email AND an API token are both required (not your password)
- For Server/DC: use a Personal Access Token, leave email blank
- Generate an API token at: `https://id.atlassian.com/manage-profile/security/api-tokens`

### Sprint Feed tasks are generic / low quality

- Ensure your CONTEXT.md has detailed flow descriptions and well-formed AC (Given/When/Then)
- Run `aibrd: Update with new requirement` to enrich sparse entries before generating the sprint feed

### Compliance mapper returns no tags

- Try broader frameworks — GDPR and WCAG have the widest applicability
- Ensure flows and rules have meaningful descriptions (not just IDs with short names)

### Staleness report shows everything as stale

- Ensure requirement IDs (e.g. `PAY-BF-001`) appear in source files or comments
- Add `// aibrd: PAY-BF-001` inline comments to help the detector find code references
- The workspace must be a git repository with commit history

### Module detection puts everything in one module

- The BRD may genuinely be single-domain — flat mode is correct
- If you expect multiple modules, ensure the BRD has clear section headings per domain

### IDs look wrong after a failed init

- Delete `.aibrd/registry.json` and run Initialize again
- The registry is rebuilt from scratch on each init
- Never manually edit `registry.json`

### @aibrd in Copilot Chat not appearing

- Ensure the aibrd extension is active (check Extensions panel)
- Reload VS Code window: Command Palette → `Developer: Reload Window`
- The chat participant requires VS Code 1.90+

---

## 17. Quick Reference Card

| I want to... | Command |
|---|---|
| Start a project | `aibrd: Initialize from BRD` |
| Start from Confluence directly | `aibrd: Ingest from Confluence` |
| Add a new PO requirement | `aibrd: Update with new requirement` |
| See what changed in a new BRD | `aibrd: Analyse Change Impact` |
| Validate the spec integrity | `aibrd: Validate CONTEXT.md` |
| Know what to build | `@aibrd tasks` in Copilot Chat |
| Understand a requirement | `@aibrd what is BF-003` |
| Generate test cases | `aibrd: Generate Test Cases` |
| See which tests cover requirements | `aibrd: Link Requirements to Test Files` |
| Check my code covers requirements | `aibrd: Show Gap Report` |
| Draft a PR description | `aibrd: Draft Pull Request Description` |
| Generate sprint tasks | `aibrd: Generate Sprint Feed` |
| Derive REST API contracts | `aibrd: Derive API Contracts` |
| Map compliance frameworks | `aibrd: Map Compliance Frameworks` |
| Prepare release notes | `aibrd: Generate Release Notes` |
| Share progress with PO | `aibrd: Generate PO Progress Report` |
| Check for stale requirements | `aibrd: Check Requirement Staleness` |
| Browse all requirements | aibrd Traceability panel (Explorer sidebar) |
| See the full RTM | `@aibrd rtm` |
| Set up CI gap checking | Add reusable workflow to `.github/workflows/` |

---

## Using aibrd Without VS Code?

See the **[Python Library Playbook](pythonlibrary/PLAYBOOK.md)** for:
- CLI usage with all 15 commands
- Bring-your-own API key (Anthropic, GitHub Models, OpenAI)
- Scripting and automation use cases
- Personal repo setup in under 5 minutes
