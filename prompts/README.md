# AIBRD — MD Prompt Templates (Option A)

> Zero setup. Copy a prompt, paste into any LLM, get structured output.  
> Works with GitHub Copilot Chat, Claude.ai, ChatGPT, Gemini, or any LLM.

---

## The Twelve Templates

| File | Use when | VS Code equivalent |
|---|---|---|
| [`extract-requirements.md`](extract-requirements.md) | You have a BRD and need to generate the initial CONTEXT.md | `aibrd: Initialize from BRD` |
| [`update-requirement.md`](update-requirement.md) | A PO has a new requirement to add to an existing CONTEXT.md | `aibrd: Update with new requirement` |
| [`validate-context.md`](validate-context.md) | Check CONTEXT.md for duplicate IDs, broken cross-refs, vague language | `aibrd: Validate CONTEXT.md` |
| [`gap-analysis.md`](gap-analysis.md) | Check whether a code file covers its BRD requirements | `aibrd: Show Gap Report` |
| [`generate-test-cases.md`](generate-test-cases.md) | Generate Given/When/Then test cases from CONTEXT.md | `aibrd: Generate Test Cases` |
| [`sprint-feed.md`](sprint-feed.md) | Break CONTEXT.md requirements into sprint tasks with story points | `aibrd: Generate Sprint Feed` |
| [`change-impact.md`](change-impact.md) | A new BRD version arrived — see what changed and what breaks | `aibrd: Analyse Change Impact` |
| [`pr-description.md`](pr-description.md) | Draft a traceable PR description from git diff + CONTEXT.md | `aibrd: Draft Pull Request Description` |
| [`api-contracts.md`](api-contracts.md) | Derive an OpenAPI 3.0 YAML spec from business flows | `aibrd: Derive API Contracts` |
| [`release-notes.md`](release-notes.md) | Generate requirement-mapped release notes from git log | `aibrd: Generate Release Notes` |
| [`po-progress-report.md`](po-progress-report.md) | Plain-English "built vs asked for" report for PO sign-off | `aibrd: Generate PO Progress Report` |
| [`compliance-map.md`](compliance-map.md) | Tag requirements against GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO 27001 | `aibrd: Map Compliance Frameworks` |

---

## How to Use

1. Open the relevant `.md` file
2. Copy everything below the `---` divider
3. Replace all `[PLACEHOLDER]` sections with your content
4. Paste into your LLM of choice
5. Copy the output into the corresponding `.aibrd/` file in your repo and commit it

**That's it. No build step, no API key, no VS Code required.**

---

## Recommended Order for a New Project

```
1. extract-requirements.md    → create .aibrd/CONTEXT.md
2. validate-context.md        → check it's clean before using it
3. gap-analysis.md            → find what's not yet built
4. generate-test-cases.md     → create test coverage
5. sprint-feed.md             → plan the work
6. compliance-map.md          → tag regulatory obligations
   — (repeat per sprint) —
7. change-impact.md           → when BRD changes arrive
8. update-requirement.md      → add individual new requirements
9. pr-description.md          → for every PR raised
10. release-notes.md          → at release time
11. po-progress-report.md     → for PO sign-off
12. api-contracts.md          → when API design is needed
```

---

## Output Files

Each prompt produces content that maps to a file in `.aibrd/`:

| Prompt | Writes to |
|---|---|
| `extract-requirements.md` | `.aibrd/CONTEXT.md` + `ambiguity-report.md` + `conflict-report.md` |
| `update-requirement.md` | `.aibrd/CONTEXT.md` (patch) + updated `registry.json` |
| `validate-context.md` | Review only — fix CONTEXT.md in place |
| `gap-analysis.md` | `.aibrd/gap-report-YYYY-MM-DD.md` |
| `generate-test-cases.md` | `.aibrd/tests/test-cases.md` |
| `sprint-feed.md` | `.aibrd/sprint-feed.md` |
| `change-impact.md` | `.aibrd/change-impact-report.md` |
| `pr-description.md` | Paste directly into PR description |
| `api-contracts.md` | `.aibrd/openapi.yaml` |
| `release-notes.md` | `.aibrd/releases/v[VERSION].md` |
| `po-progress-report.md` | `.aibrd/releases/po-report-v[VERSION].md` |
| `compliance-map.md` | `.aibrd/compliance-map.md` |

---

## What's Not Available in MD (VS Code only)

Four features require live repo access and cannot be replicated with copy-paste prompts:

| VS Code Command | Why MD can't do it |
|---|---|
| `aibrd: Show Traceability Matrix` | Interactive tree view — not a text output |
| `aibrd: Check Requirement Staleness` | Needs to scan `git log` for BF-XXX mentions |
| `aibrd: Link Requirements to Test Files` | Needs to scan all test files in the repo |
| `aibrd: Ingest from Confluence` | Requires live REST API call |
| `@aibrd` chat participant | Interactive Q&A — VS Code Copilot only |

---

## Graduating to the VS Code Extension

Once the team is on GitHub Enterprise + Copilot, the VS Code extension in [`../vscodebase/`](../vscodebase/) automates all of the above — reading BRDs directly, writing `.aibrd/` files, and keeping the traceability matrix updated on every save.

See [`../PLAYBOOK.md`](../PLAYBOOK.md) for the full VS Code extension guide.
