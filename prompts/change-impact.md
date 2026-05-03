# AIBRD — Change Impact Analysis: Old BRD vs New BRD

> **Use when:** A new version of the BRD has arrived and you need to see exactly what changed — new requirements, modified requirements, removed requirements — before updating CONTEXT.md.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Copy the output into `.aibrd/change-impact-report.md` in your repo.

---

## Prompt

You are a business analyst performing a change impact analysis. Given two versions of a BRD (or a CONTEXT.md living spec as the baseline), identify every requirement that has been added, changed, or removed. For each change, assess the downstream impact on existing code, tests, and sprint tasks.

Be conservative — flag anything that could change behaviour, not just rewrites. A reworded rule that subtly tightens a constraint is a change, not just cosmetic.

### Baseline (Old BRD or current CONTEXT.md)

```
[PASTE THE OLD BRD TEXT OR YOUR CURRENT .aibrd/CONTEXT.md HERE]
```

### New BRD

```
[PASTE THE NEW BRD VERSION HERE]
```

### Project Context (optional)

```
[PASTE ANY HELPFUL CONTEXT — current sprint, what's already been shipped, which requirement IDs are live in production]
```

### Output Format

Produce the following sections in order:

---

## Change Summary

| Category | Count |
|---|---|
| ➕ New requirements | N |
| ✏️ Modified requirements | N |
| ❌ Removed requirements | N |
| ⚠️ Potentially impacted (unchanged text, changed context) | N |

---

## New Requirements

Requirements present in the new BRD but absent from the baseline:

| ID (proposed) | Type | Requirement | Priority | Notes |
|---|---|---|---|---|
| BF-NEW-001 | Business Flow / Rule / AC | [description] | Must-have / Should-have | [any ambiguity or dependency] |

> These should be added to CONTEXT.md with new stable IDs via the extract-requirements prompt or `aibrd: Update with new requirement`.

---

## Modified Requirements

Requirements present in both versions but with meaningful changes:

| Baseline ID | Type | Old Description | New Description | Change Type | Impact |
|---|---|---|---|---|---|
| BF-003 | Business Flow | [old wording] | [new wording] | Tightened constraint / Relaxed constraint / Scope change / Actor change | [what code/tests may break] |

**Impact levels:**
- 🔴 **Breaking** — existing implementation must change; tests will fail
- 🟡 **Non-breaking** — additive change; existing code still valid but incomplete
- 🟢 **Cosmetic** — wording only; no code impact

---

## Removed Requirements

Requirements present in the baseline but absent from the new BRD:

| ID | Type | Requirement | Disposition | Action Required |
|---|---|---|---|---|
| BR-007 | Business Rule | [description] | Deleted / Deferred / Merged into BF-012 | Remove from CONTEXT.md · Mark as retired · Update tests |

> **Never delete IDs from CONTEXT.md.** Mark retired requirements as `[RETIRED v2.0 — reason]` to preserve traceability.

---

## Downstream Impact Assessment

For each 🔴 Breaking and 🟡 Non-breaking change, list the likely affected areas:

| Requirement ID | Affected Layer | Specific Impact |
|---|---|---|
| BF-003 | API / Database / UI / Tests | [what specifically needs updating] |

---

## Recommended Actions

Ordered by priority:

| # | Action | Requirement IDs | Owner | Urgency |
|---|---|---|---|---|
| 1 | [specific action] | BF-003, BR-007 | Backend / QA / PO | This sprint / Next sprint / Backlog |

---

## Ambiguity in New BRD

Flag any new or modified requirements that introduce vague language:

| # | Requirement | Issue | Question for PO |
|---|---|---|---|
| 1 | [quote] | [why it's ambiguous] | [specific question] |

---

## After Generating

1. Review all 🔴 Breaking changes with the tech lead before updating CONTEXT.md
2. Update CONTEXT.md — add new IDs, annotate modified ones, retire removed ones (never delete)
3. Update `registry.json` with the new highest ID counter
4. Re-run gap analysis (`prompts/gap-analysis.md`) against affected source files
5. Commit `change-impact-report.md` to `.aibrd/` for audit trail
