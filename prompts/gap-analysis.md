# AIBRD — Gap Analysis: Code File vs Requirements

> **Use when:** You want to check whether a specific code file (or set of files) actually covers the requirements in CONTEXT.md.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Review the output to find uncovered requirements.

---

## Prompt

You are a solution architect performing a traceability audit. Given a CONTEXT.md living specification and one or more source code files, identify which requirements are covered, partially covered, or missing entirely.

Be precise — a requirement is only "covered" if the code contains logic that implements it. A function that exists but has no logic for a business rule does not count as coverage.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE — or the relevant sections (Actors, Business Flows, Business Rules, Acceptance Criteria)]
```

### Source Code File(s)

```
[PASTE THE SOURCE FILE(S) YOU WANT TO CHECK — include the filename at the top of each block]
```

### Output Format

Produce the following sections in order:

---

## Coverage Summary

| ID | Type | Requirement | Status | Notes |
|---|---|---|---|---|
| BF-001 | Business Flow | [flow name] | ✅ Covered / ⚠️ Partial / ❌ Missing | [what's present or absent] |
| BR-001 | Business Rule | [rule name] | ✅ Covered / ⚠️ Partial / ❌ Missing | [what's present or absent] |
| AC-001 | Acceptance Criterion | [criterion summary] | ✅ Covered / ⚠️ Partial / ❌ Missing | [what's present or absent] |

---

## Coverage Score

```
Business Flows:        X / Y covered  (Z%)
Business Rules:        X / Y covered  (Z%)
Acceptance Criteria:   X / Y covered  (Z%)
Overall:               X / Y covered  (Z%)
```

---

## Missing Requirements (Action Required)

List every ❌ Missing item with enough detail for a developer to act on it:

| ID | Requirement | What Needs to Be Built |
|---|---|---|
| BF-003 | [flow name] | [specific logic or endpoint missing] |

---

## Partial Coverage (Review Needed)

List every ⚠️ Partial item:

| ID | Requirement | What's Present | What's Missing |
|---|---|---|---|
| BR-002 | [rule name] | [what exists] | [what's still needed] |

---

## Recommendations

1. [Highest priority gap — explain why it's critical]
2. [Second priority gap]
3. [Any structural issues — e.g. business rules enforced in UI but not backend]

---

## After Running

1. For each ❌ Missing item — create a ticket referencing the requirement ID (e.g. "Implement BF-003: Payment Confirmation Flow")
2. For each ⚠️ Partial item — review with the lead engineer whether the gap is intentional (deferred) or missed
3. If overall coverage is below 80% — run gap analysis on additional files before the next release
4. Commit a `gap-report-YYYY-MM-DD.md` to `.aibrd/` for audit trail
