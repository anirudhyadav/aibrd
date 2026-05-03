# AIBRD — PO Progress Report: Built vs Asked For

> **Use when:** You need a plain-English "built vs asked for" report for PO sign-off — showing which requirements are done, in progress, and not started.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Share the output directly with the Product Owner for review.

---

## Prompt

You are a delivery lead preparing a progress report for a Product Owner. Given a CONTEXT.md living specification and a current status update from the team, produce a clear, non-technical report showing exactly what was asked for vs what has been built. No jargon — the PO must be able to read this without engineering context.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE]
```

### Current Build Status

```
[DESCRIBE WHAT HAS BEEN BUILT SO FAR — e.g. list completed sprint tasks, recently merged PRs, or describe which features are live/in-progress/not-started. You can paste git log output, sprint board status, or just write it in plain English.]
```

### Report Context (optional)

```
[PASTE ANY ADDITIONAL CONTEXT — sprint number, target release date, team velocity, any blockers or risks the PO should know about]
```

### Output Format

Produce the following sections in order:

---

## Progress Report — [Project Name] — [Date]

**Prepared for:** Product Owner
**Period covered:** [Sprint N / as of DATE]

---

## Executive Summary

| Metric | Value |
|---|---|
| Total requirements | N |
| ✅ Delivered | N (X%) |
| 🔄 In progress | N (X%) |
| ❌ Not started | N (X%) |
| ⚠️ At risk | N |

[2–3 sentences in plain English: what's going well, what's at risk, overall confidence for the release]

---

## What Was Asked For vs What Was Built

| Req ID | You Asked For | Status | Notes |
|---|---|---|---|
| BF-001 | [plain English description of what the business asked for] | ✅ Done | Live in [environment] |
| BF-003 | [description] | 🔄 In Progress | 70% complete — ETA [date] |
| BF-007 | [description] | ❌ Not Started | Deferred to v1.1 — [reason] |
| BR-005 | [description] | ⚠️ At Risk | Blocked by [dependency] |

---

## Delivered ✅

Brief plain-English description of each completed item — what it means for the business:

- **[BF-001 name]** — [1–2 sentences on business value delivered]
- **[BF-002 name]** — [description]

---

## In Progress 🔄

| Requirement | % Complete | Expected by | Confidence |
|---|---|---|---|
| [BF-003 name] | 70% | [date] | 🟢 High / 🟡 Medium / 🔴 Low |

---

## Not Started / Deferred ❌

| Requirement | Reason | Proposed for |
|---|---|---|
| [BF-007 name] | [descoped / dependency / complexity] | v1.1 / Sprint N+2 |

---

## Risks and Blockers ⚠️

| # | Risk | Affected Requirements | Impact | Mitigation |
|---|---|---|---|---|
| 1 | [risk description] | BF-005, BR-003 | [business impact] | [what the team is doing] |

---

## Questions for PO Sign-off

Items the team needs a decision on before proceeding:

| # | Question | Affects | Urgency |
|---|---|---|---|
| 1 | [specific question] | BF-008 | This sprint / Next sprint |

---

## After Generating

1. Share this report with the PO — the "What Was Asked For vs What Was Built" table is the key section
2. Get explicit PO sign-off on all deferred items before they are removed from scope
3. For each "At Risk" item — escalate to the project sponsor if the PO cannot unblock it
4. Save to `.aibrd/releases/po-report-v[VERSION].md` and commit
