# AIBRD — Validate CONTEXT.md

> **Use when:** You want to check the structural integrity of CONTEXT.md — duplicate IDs, broken cross-references, missing fields, orphaned entries.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Fix any issues before the spec becomes load-bearing in tests or sprint planning.

---

## Prompt

You are a specification quality engineer. Given a CONTEXT.md living specification, perform a full structural validation. Check for every category of error listed below and produce a prioritised fix list.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE]
```

### registry.json (optional)

```json
[PASTE YOUR .aibrd/registry.json HERE — used to check for ID counter drift]
```

### Validation Checks

Run all of the following checks:

1. **Duplicate IDs** — any ID that appears more than once
2. **ID format violations** — IDs not matching `TYPE-NNN` or `MOD-TYPE-NNN` pattern
3. **Missing required fields** — any table row with blank ID, blank description, or blank actors
4. **Broken cross-references** — any ID referenced in one section that doesn't exist in another (e.g. AC references BF-009 but BF-009 is absent)
5. **Orphaned acceptance criteria** — AC entries not linked to any BF or BR
6. **Orphaned business rules** — BR entries not referenced by any BF or AC
7. **Actor references** — actors mentioned in flows but not defined in the Actors table
8. **ID counter drift** — highest ID in CONTEXT.md is higher than registry.json counter (means registry is stale)
9. **Ambiguity markers** — any field containing vague terms: "fast", "soon", "large", "many", "intuitive", "user-friendly", "reasonable", "appropriate"
10. **Retired ID references** — any active requirement referencing a `[RETIRED]` entry

### Output Format

Produce the following sections in order:

---

## Validation Summary

| Check | Status | Issues Found |
|---|---|---|
| Duplicate IDs | ✅ Pass / ❌ Fail | N issues |
| ID format | ✅ Pass / ❌ Fail | N issues |
| Missing fields | ✅ Pass / ❌ Fail | N issues |
| Broken cross-references | ✅ Pass / ❌ Fail | N issues |
| Orphaned ACs | ✅ Pass / ❌ Fail | N issues |
| Orphaned BRs | ✅ Pass / ❌ Fail | N issues |
| Actor references | ✅ Pass / ❌ Fail | N issues |
| Registry drift | ✅ Pass / ❌ Fail | N issues |
| Vague language | ✅ Pass / ⚠️ Warning | N issues |
| Retired references | ✅ Pass / ❌ Fail | N issues |

**Overall: ✅ Valid / ⚠️ Warnings only / ❌ Invalid — do not use as load-bearing spec**

---

## Issues Found

For each issue, provide:

| # | Severity | Check | Location | Issue | Fix |
|---|---|---|---|---|---|
| 1 | 🔴 Error | Duplicate IDs | BF-003 (rows 12, 47) | ID appears twice | Remove or renumber the duplicate |
| 2 | 🟡 Warning | Vague language | BR-007 | "process quickly" is unmeasurable | Replace with a specific SLA (e.g. "within 2 seconds") |

**Severity levels:**
- 🔴 **Error** — must fix before spec is used in tests or sprint planning
- 🟡 **Warning** — should fix; won't break tooling but creates ambiguity
- 🔵 **Info** — cosmetic / style suggestion

---

## Corrected registry.json

If registry drift was detected, provide the corrected version:

```json
{ "BF": N, "BR": N, "AC": N, "ACT": N }
```

> If no drift detected, write: **registry.json is consistent.**

---

## After Generating

1. Fix all 🔴 Errors before using CONTEXT.md as a source for test generation or sprint planning
2. Update `registry.json` if drift was found
3. Resolve 🟡 Warnings with the PO (vague language especially)
4. Re-run this prompt after fixes to confirm clean validation
5. Consider running `prompts/gap-analysis.md` next to check code coverage
