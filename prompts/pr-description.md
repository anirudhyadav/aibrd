# AIBRD — Draft Pull Request Description

> **Use when:** You're raising a PR and want a traceable description that maps your code changes back to requirement IDs.
>
> **How to use:** Run `git diff main...HEAD` (or `git diff <base>...<head>`), copy the output. Copy everything below the `---` divider, replace placeholders, paste into your LLM.

---

## Prompt

You are a senior engineer writing a pull request description. Given a git diff and a CONTEXT.md living specification, produce a traceable PR description that maps every changed file and function to the requirement IDs it implements or fixes.

The description should be readable by: the reviewer (technical), the QA engineer (test coverage), and the PO (business impact).

### git diff

```
[PASTE THE OUTPUT OF: git diff main...HEAD]
```

### CONTEXT.md (or relevant sections)

```
[PASTE YOUR .aibrd/CONTEXT.md HERE — or just the Actors, Business Flows, Business Rules sections]
```

### PR Context (optional)

```
[PASTE ANY ADDITIONAL CONTEXT — ticket number, linked sprint task IDs (TASK-NNN), breaking vs non-breaking, hotfix vs feature]
```

### Output Format

---

## PR Title

`[type]: [short description] — [requirement IDs]`

Examples:
- `feat: implement payment confirmation flow — BF-005, BR-003`
- `fix: enforce max retry rule on auth — BR-007`
- `chore: add test coverage for BF-002 edge cases`

---

## Summary

**What this PR does** (2–3 sentences in plain English for the PO):
[Non-technical description of what was built and why]

**Requirement coverage:**

| Req ID | Type | Requirement | Status |
|---|---|---|---|
| BF-005 | Business Flow | [flow name] | ✅ Implemented |
| BR-003 | Business Rule | [rule name] | ✅ Implemented |
| AC-007 | Acceptance Criterion | [criterion] | ✅ Covered by tests |

---

## Changes

| File | Change Type | Requirement(s) |
|---|---|---|
| `src/payments/processor.ts` | Added | BF-005 |
| `src/auth/retry.ts` | Modified | BR-007 |
| `tests/payments.test.ts` | Added | TC-012, TC-013 |

---

## Testing

- [ ] Unit tests added/updated — covers [TC-NNN, TC-NNN]
- [ ] Edge cases tested — [describe]
- [ ] Manual testing steps: [step 1, step 2]
- [ ] No regression in existing tests

---

## Checklist

- [ ] Requirement IDs referenced in commit messages
- [ ] `.aibrd/index.md` traceability matrix updated (if using VS Code extension)
- [ ] No new vague requirements introduced
- [ ] Breaking change? [Yes / No] — if Yes, describe migration path

---

## After Generating

1. Paste the PR title and body directly into GitHub / GitLab / Bitbucket
2. Link the PR to the relevant sprint task IDs (TASK-NNN) in your issue tracker
3. Ask the reviewer to verify requirement coverage in the table above
4. After merge, update staleness tracking if using `aibrd: Check Requirement Staleness`
