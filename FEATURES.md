# AIBRD — Complete Feature Reference

> All features across both layers (BRD → Specification and Judgment), all three delivery paths (MD templates, VS Code extension, Python library), and all six judgment modes.

---

## Overview

AIBRD is a two-layer AI engineering assistant:

| Layer | What it does |
|---|---|
| **BRD Layer** | Converts Business Requirements Documents into version-controlled living specifications with full traceability from requirement to shipped code |
| **Judgment Layer** | Adds structured code review, architectural stress-testing, ADR generation, and design conflict resolution on top of any AI code-generation tool |

---

## Layer 1 — BRD to Living Specification

### Input Formats Supported

| Format | Path |
|---|---|
| PDF | `src/` (VS Code) · `pythonlibrary/` (Python) |
| Word (.docx) | `src/` · `pythonlibrary/` |
| Markdown | `src/` · `pythonlibrary/` · `prompts/` (manual) |
| Confluence page (REST API) | `src/` · `pythonlibrary/` |

### Core Extraction

| Feature | What it produces | Command / Prompt |
|---|---|---|
| **Requirements extraction** | Actors, business flows, business rules, acceptance criteria — all with stable IDs | `aibrd: Initialize from BRD` · `aibrd init` · `prompts/extract-requirements.md` |
| **CONTEXT.md generation** | Living spec committed to git alongside code | auto-generated on init |
| **Stable requirement IDs** | IDs in format `BF-001`, `BR-012`, `ACT-001`, `GBR-002` that are never reused or deleted | registry.json |
| **Modular detection** | Auto-detects large projects and partitions into modules (`PAY-BF-012`, `AUTH-BR-003`) | automatic |
| **Ambiguity flagging** | Identifies vague terms ("fast", "intuitive", "soon") and flags them for PO resolution | `ambiguity-report.md` |
| **Conflict detection** | Finds contradicting requirements within the same BRD | `conflict-report.md` |

### Ongoing Maintenance

| Feature | What it does | Command |
|---|---|---|
| **Requirement update** | Appends a new PO requirement to CONTEXT.md with a new stable ID | `aibrd: Update with new requirement` · `aibrd update "..."` |
| **Change impact analysis** | Compares old BRD vs new BRD — flags new, changed, and removed requirements with downstream impact | `aibrd: Analyse Change Impact` · `aibrd change-impact` · `prompts/change-impact.md` |
| **Staleness detection** | Cross-references BF-XXX IDs against git log — flags requirements not touched by any commit in N days | `aibrd: Check Requirement Staleness` · `aibrd stale` |
| **CONTEXT.md validation** | Checks structure integrity, cross-references, duplicate IDs, and missing required sections | `aibrd: Validate CONTEXT.md` · `aibrd validate` |

### Traceability

| Feature | What it produces | Command |
|---|---|---|
| **Requirement Traceability Matrix (RTM)** | Maps every BF/BR/AC to its test cases and source files | `aibrd: Show Traceability Matrix` · sidebar tree view |
| **Gap report** | Shows which open files have zero coverage against BRD requirements | `aibrd: Show Gap Report` · `aibrd gaps <file>` |
| **Test linkage** | Scans test files for BF-XXX/BR-XXX ID mentions — produces coverage % per requirement | `aibrd: Link Requirements to Test Files` · `aibrd test-linkage` |
| **PR description drafting** | Generates a traceable PR description mapping code changes to requirement IDs | `aibrd: Draft Pull Request Description` · `aibrd pr-draft` |

### Delivery Tools

| Feature | What it produces | Command |
|---|---|---|
| **Test case generation** | Given/When/Then test cases from CONTEXT.md, ready for QA | `aibrd: Generate Test Cases` · `aibrd tests` |
| **Release notes** | git diff → release notes mapped to requirement IDs | `aibrd: Generate Release Notes` · `aibrd release v2.x.x` |
| **Sprint feed** | CONTEXT.md → TASK-NNN cards with story points and acceptance criteria | `aibrd: Generate Sprint Feed` · `aibrd sprint` |
| **GitHub Issues export** | Sprint tasks formatted as GitHub Issues JSON for direct import | `aibrd sprint --github-issues` |
| **API contract derivation** | Business flows → OpenAPI 3.0 YAML spec before dev starts | `aibrd: Derive API Contracts` · `aibrd api-contracts` |
| **PO progress report** | Plain-English "what was built vs what was asked for" report for PO sign-off | `aibrd: Generate PO Progress Report` · `aibrd po-report` |
| **Compliance mapping** | Tags requirements against GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO27001 automatically | `aibrd: Map Compliance Frameworks` · `aibrd compliance` |

### Ingestion

| Feature | What it does | Command |
|---|---|---|
| **Confluence ingestion** | Fetches a Confluence page and its children via REST API → CONTEXT.md | `aibrd: Ingest from Confluence` · `aibrd confluence` |
| **Multi-format parsing** | Handles mixed-format BRDs (PDF + embedded tables, DOCX with tracked changes) | automatic |

### @aibrd Copilot Chat Participant

Ask natural-language questions about your living spec inside VS Code:

```
@aibrd what is BF-003?          ← look up any requirement by ID
@aibrd tasks                    ← list open dev tasks
@aibrd coverage                 ← coverage % for current file
@aibrd rtm                      ← refresh traceability matrix
```

### CI/CD Integration

```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

Runs gap check on every PR using `GITHUB_TOKEN` + GitHub Models — no additional API key required.

---

## Layer 2 — Judgment on AI-Generated Code

### The Three Roles

| Role | Symbol | Purpose | Gate output |
|---|---|---|---|
| **Judge** | ⚖ | Evaluate code against team standards | `APPROVE / REQUEST_CHANGES / BLOCK` |
| **Advocate** | 📐 | Stress-test and document design decisions | `PROCEED / REVISE / RECONSIDER` → ADR |
| **Mediator** | 🤝 | Resolve engineering deadlocks | Synthesis + validation experiment |

### Judge — Code Review

**Mode:** `@judge /review` or `judge-review.md`

Evaluates code against a structured rubric across five categories:

| Category | Rules (defaults) | Severity |
|---|---|---|
| Code Quality | Function ≤40 lines, docstrings, cyclomatic complexity ≤10, no magic numbers | warn |
| Security | No hardcoded credentials, parameterised queries, input validation, no dynamic exec | **error / BLOCK** |
| Testing | Behavioural assertion, no trivial mocks, deterministic, edge cases | **error / BLOCK** |
| Architecture | No circular imports, thin controllers, API versioning | warn |
| Process | No TODOs, no commented-out code, use logging not print | warn |

Output: `APPROVE / REQUEST_CHANGES / BLOCK` · Score 0–100 · Severity-graded findings table · Specific line-level recommendations

### Judge — Security Audit

**Mode:** `@judge /security` or security section of `judge-review.md`

OWASP Top-10 focused audit:

| OWASP Category | What is checked |
|---|---|
| A01 Broken Access Control | Missing auth checks, insecure direct object references |
| A02 Cryptographic Failures | Weak algorithms, hardcoded keys, unencrypted sensitive data |
| A03 Injection | SQL, NoSQL, OS command, LDAP injection via user input |
| A04 Insecure Design | Missing rate limiting, flawed business logic |
| A05 Security Misconfiguration | Default credentials, verbose errors, unnecessary features |
| A06 Vulnerable Components | Known CVEs, outdated libraries |
| A07 Auth / Session Failures | Weak session management, missing MFA |
| A08 Software Integrity Failures | Unsigned code, insecure deserialization |
| A09 Logging / Monitoring Failures | Missing audit logs on auth events |
| A10 SSRF | User-controlled URLs reaching internal services |

Output: `PASS / WARN / FAIL` · Risk level (LOW / MEDIUM / HIGH / CRITICAL) · Findings table with OWASP category, location, and fix recommendation

### Advocate — Devil's Advocate

**Mode:** `@advocate /devil` or `advocate-devil.md`

Stress-tests a design proposal before any implementation begins:

- Risk score 0–100
- Critical flaws with specific downstream impact
- Hidden assumptions that may not hold in production
- Failure scenarios table (likelihood × impact)
- Minimum changes needed to proceed
- Genuine strengths acknowledged (required — not optional)

**Gate rule:**

| Verdict | What it means | Next action |
|---|---|---|
| `PROCEED` | Risk ≤40, no critical flaws | Generate ADR → hand off to agents |
| `REVISE` | Addressable flaws exist | Fix specific items → re-run Devil |
| `RECONSIDER` | Fundamental design issue | Escalate to architecture review before any agent handoff |

### Advocate — ADR Generator

**Mode:** `@advocate /adr` or `advocate-adr.md`

Produces a full Architecture Decision Record:

| Section | Content |
|---|---|
| Context | 3–5 sentences on why the decision is needed now |
| Decision | Chosen approach in 1–2 sentences |
| Rationale | ≥3 specific reasons tied to constraints |
| Alternatives Considered | ≥2 alternatives with specific rejection reasons |
| Trade-offs | Benefits vs costs table |
| Consequences | Downstream impacts, migration path, who is affected |
| Anticipated Objections | Pre-prepared responses for architects, managers, staff engineers |

ADRs stored in `.aibrd/decisions/ADR-NNN-title.md` alongside the code they affect.

### Mediator — Design Conflict

**Mode:** `@mediator /design` or `mediate-design.md`

Resolves sprint-blocking engineering disagreements:

- Identifies common ground (often missed in surface debates)
- Names the real crux (not the surface-level argument)
- Catalogs each position's genuine strengths
- Proposes a unified synthesis preserving the strongest elements of both
- Suggests the smallest validation experiment before full commitment
- Explicitly names what still requires a human decision (ownership, budget, timeline)

### Mediator — Dependency Conflict

**Mode:** `@mediator /deps` or deps section of `mediate-design.md`

Resolves package version constraint conflicts:

- Root cause analysis of which constraint is binding and why
- Minimal version pin recommendation (not "upgrade everything")
- Breakage risk assessment (LOW / MEDIUM / HIGH)
- Specific breaking changes to watch for from changelogs
- Verification commands to confirm resolution and catch regressions

### Multi-LLM Routing (VS Code Extension)

The judgment extension auto-selects the best available model per role — no configuration needed:

| Role | Primary | Fallback | Last resort |
|---|---|---|---|
| Judge: Review | Claude | GPT-4o | Gemini |
| Judge: Security | Claude | GPT-4o | Gemini |
| Advocate: ADR | GPT-4o | Claude | Gemini |
| Advocate: Devil | Claude | GPT-4o | Gemini |
| Mediator: Design | Claude | GPT-4o | Gemini |
| Mediator: Deps | GPT-4o | Claude | Gemini |

Rationale: Claude for nuanced reasoning and adversarial analysis; GPT-4o for structured document generation and precise constraint logic. Falls back gracefully if only one model is available.

### Team Customization

Edit `md-templates/team_standards.md` (Option A) or `vscode-extension/src/prompts.ts` (Option B):

- Add stack-specific rules (TypeScript `any` ban, FastAPI Pydantic enforcement, etc.)
- Set severity levels (error = BLOCK, warn = REQUEST_CHANGES, info = no verdict impact)
- Define fast-track approvals for low-risk change categories
- Maintain a calibration log of rubric changes with reasons

**Health indicator — override rate:**

| Rate | Meaning | Action |
|---|---|---|
| < 5% | Rubber-stamping | Tighten rubric or verify real code is being reviewed |
| 10–25% | Healthy | No action |
| > 30% | Rubric misaligned | Recalibrate — loosen or remove consistently overridden rules |

---

## Delivery Paths — Feature Matrix

| Feature | Option A (MD) | Option B VS Code src/ | Option B vscode-extension/ | Option C Python |
|---|---|---|---|---|
| BRD extraction | ✅ prompts/ | ✅ 16 commands | — | ✅ 15 CLI commands |
| Judgment layer | ✅ md-templates/ | — | ✅ @judge @advocate @mediator | — |
| LLM flexibility | Any (manual paste) | Copilot only | Copilot (auto-routed) | Anthropic / GitHub Models / OpenAI |
| Zero setup | ✅ | ❌ (npm + F5) | ❌ (build + install) | ❌ (pip install) |
| API keys required | None | None | None | One provider |
| CI/CD integration | ❌ | ✅ | ❌ | ✅ |
| Confluence ingestion | ❌ | ✅ | ❌ | ✅ |
| @aibrd chat | ❌ | ✅ | ❌ | ❌ |
| Works offline | ✅ | ❌ | ❌ | ❌ |
| Modular large projects | ❌ | ✅ auto | ❌ | ✅ auto |
| Multi-LLM routing | Manual (user chooses) | Single model | ✅ automatic per role | Manual (config) |
| Best team size | 1–5 | 5–50+ | 5–50+ | 1–20 |

---

## End-to-End Feature Flow

```
BRD (PDF / Word / Confluence / Markdown)
  │
  ▼ [BRD Layer]
Extract: actors, flows, rules, acceptance criteria
  │
  ├─→ CONTEXT.md (living spec, versioned in git)
  ├─→ ambiguity-report.md (vague terms → PO resolves)
  ├─→ conflict-report.md (contradictions → architect resolves)
  ├─→ test-cases.md (Given/When/Then)
  ├─→ openapi.yaml (API contracts)
  ├─→ sprint-feed.md (TASK-NNN with story points)
  ├─→ compliance-map.md (GDPR/HIPAA/SOX tags)
  └─→ index.md (requirement traceability matrix)

Dev cycle
  │
  ├─→ Design proposed
  │     └─→ [Judgment Layer] @advocate /devil → PROCEED/REVISE/RECONSIDER
  │               └─→ PROCEED → @advocate /adr → ADR committed to .aibrd/decisions/
  │
  ├─→ Code written (by human, Copilot, Claude Code, Devin)
  │     └─→ [Judgment Layer] @judge /review → APPROVE/REQUEST_CHANGES/BLOCK
  │               └─→ @judge /security → PASS/WARN/FAIL (OWASP)
  │
  ├─→ Disagreement blocks sprint
  │     └─→ [Judgment Layer] @mediator /design → synthesis + experiment
  │               └─→ @mediator /deps → version pins resolved
  │
  └─→ PR merged
        ├─→ [BRD Layer] gap detector: PR vs BRD requirements (CI)
        ├─→ staleness check: BF-XXX IDs vs git log
        └─→ test linkage: test files vs requirement IDs

Release
  └─→ aibrd release v2.x.x → release notes mapped to BF/BR IDs
        └─→ aibrd po-report → plain-English report for PO sign-off
```

---

## Security & Compliance Features

| Feature | Detail |
|---|---|
| No API keys (VS Code paths) | Uses `vscode.lm` — your org's existing Copilot licence |
| No data leaving your environment | All LLM calls go through Copilot's existing data residency agreements |
| Compliance framework tagging | Auto-tags requirements to GDPR, WCAG 2.1, HIPAA, SOX, PCI-DSS, ISO 27001 |
| OWASP Top-10 audit | Built into Judge security mode — maps findings to OWASP categories |
| Stable requirement IDs | `registry.json` ensures IDs are permanent and auditable |
| Git-versioned specs | All artifacts in `.aibrd/` are version-controlled — full change history |
| CI gap check | GitHub Actions workflow runs on every PR — no manual trigger needed |

---

## Requirements Summary

| | Option A | Option B src/ | Option B vscode-extension/ | Option C |
|---|---|---|---|---|
| GitHub Copilot | Optional | Required | Required | No |
| VS Code | Any | 1.93+ | 1.93+ | No |
| Node.js | No | 18+ | 18+ | No |
| Python | No | No | No | 3.9+ |
| API keys | None | None | None | One LLM provider |

---

*AIBRD v0.2 — MIT License — Author: Anirudh Yadav*
