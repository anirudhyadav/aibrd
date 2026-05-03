# AIBRD — Generate Test Cases from CONTEXT.md

> **Use when:** You want Given/When/Then test cases generated directly from your living spec.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Copy the output into `.aibrd/tests/test-cases.md` in your repo.

---

## Prompt

You are a QA engineer and test architect. Given a CONTEXT.md living specification, generate a comprehensive set of Given/When/Then test cases covering every business flow, business rule, and acceptance criterion.

For each requirement, generate:
- At least one **happy path** test
- At least one **negative / error path** test
- Edge cases where the business rule has a boundary condition

Each test case must reference the requirement ID it validates.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE]
```

### Test Context (optional)

```
[PASTE ANY ADDITIONAL CONTEXT — test framework (Jest, Pytest, Cypress, etc.), unit vs integration vs E2E, any known edge cases the team has discussed]
```

### Output Format

Produce the following sections in order:

---

## Test Cases

### TC-001 — [Test Name]

| Field | Value |
|---|---|
| **Requirement** | BF-001 |
| **Type** | Unit / Integration / E2E |
| **Priority** | P1 Critical / P2 High / P3 Medium / P4 Low |
| **Path** | Happy path / Negative path / Edge case |

**Given** [the system is in this state]
**When** [this action is taken]
**Then** [this outcome occurs]

**And** [additional assertion if needed]

---

[Repeat TC-NNN block for each test case]

---

## Coverage Summary

| Req ID | Type | Requirement | Test Cases | Coverage |
|---|---|---|---|---|
| BF-001 | Business Flow | [name] | TC-001, TC-002 | ✅ Happy + Negative |
| BR-003 | Business Rule | [name] | TC-005 | ⚠️ Happy only |
| AC-002 | Acceptance Criterion | [name] | TC-008, TC-009 | ✅ Full |

---

## ID Assignment Rules

- Test case IDs are `TC-NNN` — start at `TC-001` unless a starting number is provided
- Each TC must reference at least one `BF-NNN`, `BR-NNN`, or `AC-NNN`
- Priority: P1 = system broken without it · P2 = major feature · P3 = standard · P4 = nice-to-have

---

## After Generating

1. Copy test cases into `.aibrd/tests/test-cases.md`
2. Add `TC-NNN` IDs to `registry.json` with the highest number used
3. Reference `TC-NNN` IDs in your test file comments so `aibrd: Link Requirements to Test Files` can track coverage
4. Commit — test cases are now version-controlled alongside the spec
