# AIBRD Team Standards

> This file defines the rubric the Judge uses to evaluate code.
> **Edit this file for your team. Commit it to your repo. Version it like code.**
>
> When using `judge-review.md`, paste this file's content into the `[PASTE YOUR team_standards.md CONTENT HERE]` placeholder.
> When using the VS Code extension, this content is baked into `vscode-extension/src/prompts.ts`.

---

## How to Use This File

1. Copy this file into your team repo: `aibrd/team_standards.md`
2. Edit the rules below to match your team's actual standards
3. Delete rules that do not apply to your stack
4. Add stack-specific rules in the "Team Additions" section at the bottom
5. Update when the team disagrees with a verdict more than 3 times on the same rule

---

## Severity Levels

| Severity | Verdict impact | Use for |
|---|---|---|
| `error` | Triggers **BLOCK** | Security issues, missing tests on new logic |
| `warn` | Triggers **REQUEST_CHANGES** | Code quality, architecture, process |
| `info` | No verdict impact | Style observations |

---

## Code Quality Rules

| Rule | Severity | Default |
|---|---|---|
| No function exceeds 40 lines of executable code (excluding docstrings/comments) | warn | ✅ keep |
| Every public method has a docstring: purpose, parameters, return value | warn | ✅ keep |
| Cyclomatic complexity ≤ 10 per function | warn | ✅ keep |
| No magic numbers — use named constants for any non-zero/non-one literal | warn | ✅ keep |
| Meaningful variable names — no single-letter variables outside loops or coordinates | info | ✅ keep |

**Your customisations:**
```
[ADD OR REMOVE RULES FOR YOUR STACK HERE]
Example: No `any` types in TypeScript — use proper interfaces (warn)
Example: Max class length 300 lines (warn)
```

---

## Security Rules

> All security rules default to `error` — they trigger BLOCK.

| Rule | Severity |
|---|---|
| No hardcoded credentials, secrets, or API keys in any committed file | error |
| No fallback secrets in JWT signing, encryption, or auth flows | error |
| No direct SQL string concatenation — use parameterised queries or ORM | error |
| All user input validated before reaching business logic | error |
| No `eval()`, `exec()`, or equivalent dynamic execution of user-supplied data | error |

**Your customisations:**
```
[ADD STACK-SPECIFIC SECURITY RULES HERE]
Example: All API endpoints require authentication middleware (error)
Example: No raw HTML concatenation in server-rendered templates (error)
```

---

## Testing Rules

| Rule | Severity | Default |
|---|---|---|
| New logic has at least one unit test asserting behaviour, not implementation | error | ✅ keep |
| No trivial tests that mock the entire system under test | error | ✅ keep |
| Tests are deterministic — no timing dependencies, no random data without seeds | error | ✅ keep |
| Edge cases tested: empty input, null, max boundary, negative cases | warn | ✅ keep |

**Your customisations:**
```
[ADD YOUR COVERAGE THRESHOLDS OR TESTING FRAMEWORK RULES HERE]
Example: Minimum 80% branch coverage for new files (warn)
Example: All database interactions have integration tests (error)
```

---

## Architecture Rules

| Rule | Severity | Default |
|---|---|---|
| No circular imports between modules | warn | ✅ keep |
| No business logic in controllers — keep route handlers thin | warn | ✅ keep |
| Breaking API changes require a version increment or migration path | warn | ✅ keep |

**Your customisations:**
```
[ADD YOUR ARCHITECTURAL CONSTRAINTS HERE]
Example: No direct database queries from frontend code (error)
Example: All infrastructure changes require a linked ADR (warn)
```

---

## Process Rules

| Rule | Severity | Default |
|---|---|---|
| No TODO or FIXME comments in merged code | warn | ✅ keep |
| No commented-out code blocks | warn | ✅ keep |
| Use the team's logging framework — no bare `print` statements | warn | ✅ keep |

**Your customisations:**
```
[ADD TEAM PROCESS RULES HERE]
Example: All PRs reference a ticket ID in the description (info)
Example: No direct commits to main — all changes via PR (warn)
```

---

## Team Additions

> Add rules that are specific to your team, stack, or domain here.
> These extend the org-wide rules above — do not remove org rules from the sections above.

```
Team: [YOUR TEAM NAME]

[Rule 1] — [severity]
[Rule 2] — [severity]
[Rule 3] — [severity]
```

---

## Fast-Track Rules (APPROVE without full review)

> Define categories of changes the Judge should approve quickly, reducing friction for low-risk work.

```
Examples:
- Internal tooling scripts under 100 lines with no external API calls
- Documentation-only changes (no code)
- Dependency version patches (semver patch, no breaking changes)
```

---

## Calibration Log

> Keep a short log of when this rubric was updated and why. Treat it like a changelog.

| Date | Change | Reason |
|---|---|---|
| [date] | [what changed] | [why — override rate, incident, team feedback] |
