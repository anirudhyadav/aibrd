# AIBRD — Update CONTEXT.md with a New Requirement

> **Use when:** A PO or stakeholder has raised a new requirement after CONTEXT.md was initialised, and you need to add it with the correct next stable ID without breaking the existing spec.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Apply the output patch to your `.aibrd/CONTEXT.md`.

---

## Prompt

You are a business analyst maintaining a living specification. Given an existing CONTEXT.md and a new requirement described in plain English, add the requirement to the correct section with the next available stable ID.

Rules:
- Never reuse or renumber existing IDs
- Assign the next sequential ID after the highest existing one (check `registry.json` if provided)
- If the new requirement touches existing flows or rules, add cross-references
- If the new requirement conflicts with or is ambiguous against existing ones, flag it — do not silently merge

### Current CONTEXT.md

```
[PASTE YOUR CURRENT .aibrd/CONTEXT.md HERE]
```

### Current registry.json (optional but recommended)

```json
[PASTE YOUR .aibrd/registry.json HERE — e.g. { "BF": 5, "BR": 8, "AC": 12, "ACT": 3 }]
```

### New Requirement

```
[DESCRIBE THE NEW REQUIREMENT IN PLAIN ENGLISH — include who asked for it, what triggered it, and any constraints the PO mentioned]
```

### Output Format

Produce the following:

---

## New Entry — [Type] [ID]

**Section:** Actors / Business Flows / Business Rules / Acceptance Criteria
**ID:** [next available ID, e.g. BF-006]

[Formatted table row ready to paste into the correct section of CONTEXT.md]

---

## Updated registry.json

```json
{ "BF": N, "BR": N, "AC": N, "ACT": N }
```

---

## Cross-references

List any existing requirements affected by this new entry:

| Existing ID | Relationship | What to Add |
|---|---|---|
| BF-003 | Extends | Add note: "See also BF-006 for [scenario]" |

---

## Conflict / Ambiguity Check

| # | Issue | Existing Req | Question for PO |
|---|---|---|---|
| 1 | [any conflict or ambiguity] | [ID] | [question] |

> If no conflicts or ambiguities, write: **None detected.**

---

## After Generating

1. Add the new table row to the correct section in CONTEXT.md
2. Update `registry.json` with the new highest ID
3. Apply any cross-reference notes to existing entries
4. Resolve any flagged ambiguities with the PO before the ID becomes load-bearing in tests
5. Commit with message: `spec: add [ID] — [brief description]`
