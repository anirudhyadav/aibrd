# AIBRD — Extract Requirements from BRD

> **Use when:** You have a BRD (or part of one) and need to generate the initial CONTEXT.md living spec.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Copy the output into `.aibrd/CONTEXT.md` in your repo and commit it.

---

## Prompt

You are a business analyst and solution architect. Extract all structured requirements from the BRD below and produce a living specification in the exact format described.

Be thorough — do not skip flows, rules, or actors. If a requirement is ambiguous, flag it in the ambiguity section rather than guessing. If two requirements contradict each other, flag them in the conflict section.

### BRD Content

```
[PASTE YOUR BRD TEXT HERE — or describe the feature/system in plain English if you don't have a formal BRD]
```

### Project Context (optional)

```
[PASTE ANY ADDITIONAL CONTEXT — system name, tech stack, team size, existing constraints]
```

### Output Format

Produce the following sections in order:

---

## Actors

| ID | Actor | Description | Type |
|---|---|---|---|
| ACT-001 | [actor name] | [what this actor does] | human / system / external |

---

## Business Flows

| ID | Flow | Description | Actors Involved |
|---|---|---|---|
| BF-001 | [flow name] | [what triggers it, what it does, what it produces] | ACT-001, ACT-002 |

---

## Business Rules

| ID | Rule | Description | Applies To |
|---|---|---|---|
| BR-001 | [rule name] | [exact constraint or condition] | BF-001 |

---

## Acceptance Criteria

| ID | Criterion | Flow / Rule | Priority |
|---|---|---|---|
| AC-001 | [Given X / When Y / Then Z] | BF-001 | must-have / should-have / nice-to-have |

---

## Ambiguity Report

Flag any requirement that uses vague language ("fast", "intuitive", "soon", "large", "many") or is underspecified:

| # | Requirement | Issue | Question for PO |
|---|---|---|---|
| 1 | [quote the vague term in context] | [why it's ambiguous] | [specific question to resolve it] |

---

## Conflict Report

Flag any two requirements that cannot both be true at the same time:

| # | Requirement A | Requirement B | Conflict Description |
|---|---|---|---|
| 1 | [ID + description] | [ID + description] | [why they conflict] |

---

## ID Assignment Rules

- IDs are permanent once assigned — never reuse a retired ID
- Use `BF-NNN`, `BR-NNN`, `AC-NNN`, `ACT-NNN` for small/single-module projects
- Use `MOD-BF-NNN` format (e.g. `PAY-BF-012`, `AUTH-BR-003`) for projects with distinct modules
- Start numbering at 001 for this document unless a starting number is provided

---

## After Generating

1. **Read the output carefully** before committing — the LLM may merge flows that should be separate or miss edge cases in complex BRDs
2. **Resolve ambiguity-report items** with the business before the spec becomes load-bearing in tests
3. **Create `.aibrd/registry.json`** with the highest ID number used, so future updates don't reuse IDs:
   ```json
   { "BF": 5, "BR": 8, "AC": 12, "ACT": 3 }
   ```
4. Commit `.aibrd/CONTEXT.md` and `registry.json` — your team now has a living spec
