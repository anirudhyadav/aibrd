# AIBRD — Complete Feature Reference

> BRD to Living Specification — all features across both delivery paths.

---

## What AIBRD Does

Converts Business Requirements Documents (PDF, Word, Confluence, Markdown) into version-controlled, traceable specifications committed to git alongside the code. Keeps the thread alive between what the business asked for and what got shipped.

---

## Input Formats

| Format | Supported |
|---|---|
| PDF | ✅ |
| Word (.docx) | ✅ |
| Markdown | ✅ |
| Confluence page (REST API) | ✅ |

---

## Core Extraction

| Feature | What it produces |
|---|---|
| **Requirements extraction** | Actors, business flows, business rules, acceptance criteria — all with stable IDs |
| **CONTEXT.md generation** | Living spec committed to git alongside code |
| **Stable requirement IDs** | `BF-001`, `BR-012`, `ACT-001` — never reused, never deleted |
| **Modular detection** | Auto-partitions large projects: `PAY-BF-012`, `AUTH-BR-003` |
| **Ambiguity flagging** | Identifies vague terms ("fast", "intuitive") → `ambiguity-report.md` for PO resolution |
| **Conflict detection** | Finds contradicting requirements → `conflict-report.md` |

---

## Ongoing Maintenance

| Feature | What it does | Command (VS Code) | Prompt (Option A) |
|---|---|---|---|
| **Requirement update** | Appends new PO requirement to CONTEXT.md with new stable ID | `aibrd: Update with new requirement` | — |
| **Change impact analysis** | Old BRD vs new BRD — flags new, changed, removed requirements | `aibrd: Analyse Change Impact` | `prompts/change-impact.md` |
| **Staleness detection** | Cross-references BF-XXX IDs against git log — flags requirements not touched in N days | `aibrd: Check Requirement Staleness` | — |
| **CONTEXT.md validation** | Checks structure integrity, cross-references, duplicate IDs | `aibrd: Validate CONTEXT.md` | — |

---

## Traceability

| Feature | What it produces | Command |
|---|---|---|
| **Requirement Traceability Matrix** | Maps every BF/BR/AC to its test cases and source files | `aibrd: Show Traceability Matrix` |
| **Gap report** | Which open files have zero coverage against BRD requirements | `aibrd: Show Gap Report` · `prompts/gap-analysis.md` |
| **Test linkage** | Scans test files for BF-XXX/BR-XXX mentions — produces coverage % | `aibrd: Link Requirements to Test Files` |
| **PR description drafting** | Maps code changes to requirement IDs in the PR description | `aibrd: Draft Pull Request Description` |

---

## Delivery Tools

| Feature | What it produces | Command (VS Code) | Prompt (Option A) |
|---|---|---|---|
| **Test case generation** | Given/When/Then test cases from CONTEXT.md | `aibrd: Generate Test Cases` | — |
| **Release notes** | git diff → release notes mapped to requirement IDs | `aibrd: Generate Release Notes` | — |
| **Sprint feed** | CONTEXT.md → TASK-NNN cards with story points and acceptance criteria | `aibrd: Generate Sprint Feed` | `prompts/sprint-feed.md` |
| **API contract derivation** | Business flows → OpenAPI 3.0 YAML spec | `aibrd: Derive API Contracts` | — |
| **PO progress report** | Plain-English "built vs asked for" for PO sign-off | `aibrd: Generate PO Progress Report` | — |
| **Compliance mapping** | Tags requirements against GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO27001 | `aibrd: Map Compliance Frameworks` | `prompts/compliance-map.md` |

---

## Ingestion

| Feature | What it does | Command |
|---|---|---|
| **Confluence ingestion** | Fetches Confluence page + children via REST API → CONTEXT.md | `aibrd: Ingest from Confluence` |
| **Multi-format parsing** | Handles mixed-format BRDs (PDF tables, DOCX tracked changes) | automatic |

---

## @aibrd Copilot Chat Participant

```
@aibrd what is BF-003?    ← look up any requirement by ID
@aibrd tasks              ← list open dev tasks
@aibrd coverage           ← coverage % for current file
@aibrd rtm                ← refresh traceability matrix
```

---

## CI/CD

Runs gap check on every PR via GitHub Actions using `GITHUB_TOKEN` — no additional API key:

```yaml
jobs:
  aibrd-check:
    uses: org/aibrd/.github/workflows/aibrd-reusable.yml@main
```

---

## Delivery Path Comparison

| Feature | Option A (prompts/) | Option B (vscodebase/) |
|---|---|---|
| Setup | Zero | 15 min |
| LLM | Any (manual paste) | GitHub Copilot (auto) |
| BRD extraction | ✅ via prompts | ✅ 16 commands |
| Confluence ingestion | ❌ | ✅ |
| CI/CD integration | ❌ | ✅ |
| @aibrd chat | ❌ | ✅ |
| Works offline / air-gapped | ✅ | ❌ |
| Modular large projects | ❌ | ✅ auto-detected |
| API keys required | None | None |

---

## ID Reference

| Format | Example | Scope |
|---|---|---|
| `TYPE-NNN` | `BF-001`, `BR-012` | Small projects |
| `MOD-TYPE-NNN` | `PAY-BF-012`, `AUTH-BR-003` | Large/modular |
| `ACT-NNN` | `ACT-001` | Global actors |
| `GBR-NNN` | `GBR-002` | Global rules |

**Types:** `BF` Business Flow · `BR` Business Rule · `AC` Acceptance Criteria · `TC` Test Case · `RN` Release Note · `ACT` Actor

---

## Personas

| Role | Option A | Option B (VS Code) |
|---|---|---|
| **Tech Lead** | Extract requirements prompt | `aibrd: Initialize from BRD` |
| **Lead Engineer** | — | `aibrd: Update with new requirement` |
| **Developer** | Gap analysis prompt | `@aibrd tasks` |
| **QA / Tester** | — | `aibrd: Generate Test Cases` |
| **Release Manager** | — | `aibrd: Generate Release Notes` |
| **Scrum Master** | Sprint feed prompt | `aibrd: Generate Sprint Feed` |
| **Architect** | — | `aibrd: Derive API Contracts` |
| **Compliance Officer** | Compliance map prompt | `aibrd: Map Compliance Frameworks` |
| **Product Owner** | — | Receives PO Progress Report |

---

*AIBRD v0.2 — MIT License — Author: Anirudh Yadav*
