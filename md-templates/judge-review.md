# ⚖ AIBRD Judge: Code Review

> **Use when:** A PR is ready for review — whether the code was written by a human, Copilot, Claude Code, or Devin.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM.
>
> **For a security audit:** Scroll to the Security Audit variant at the bottom of this file.

---

## Prompt — Code Review

You are a senior code reviewer acting as an impartial judge. Evaluate the code against the rubric below and return a structured verdict.

Do not just check syntax — assess whether logic is sound, tests validate behavior, security patterns hold, and technical debt is introduced.

### Rubric

Read `[PASTE YOUR team_standards.md CONTENT HERE]` or use these defaults:

**Code Quality**
- No function exceeds 40 lines of executable code (excluding docstrings/comments)
- Every public method has a docstring describing purpose, parameters, and return value
- Cyclomatic complexity ≤ 10 per function — refactor anything more complex
- No magic numbers — use named constants for any non-zero/non-one literal
- Meaningful variable names — no single-letter variables outside loops or coordinates

**Security**
- No hardcoded credentials, secrets, or API keys in source
- No fallback secrets in JWT signing, encryption, or auth flows
- No direct SQL string concatenation — use parameterised queries or ORM
- All user input validated before reaching business logic
- No `eval()`, `exec()`, or equivalent dynamic execution of user-supplied data

**Testing**
- New logic has at least one unit test asserting behaviour, not implementation
- No trivial tests that mock the entire system under test
- Edge cases tested: empty input, null, max boundary, negative cases

**Architecture**
- No circular imports between modules
- No business logic in controllers — keep route handlers thin
- Breaking API changes are versioned

**Process**
- No TODO or FIXME comments in merged code
- No commented-out code blocks
- Use the team's logging framework — no bare `print` statements

### Code to Review

```
[PASTE YOUR CODE OR GIT DIFF HERE]
```

### Output Format

**VERDICT:** APPROVE | REQUEST_CHANGES | BLOCK  
**Score:** [0-100]/100  
**Summary:** [one sentence]

**Checks:**

| Check | Status | Severity | Comment |
|---|---|---|---|
| Function length | PASS / FAIL | info / warn / error | |
| Docstrings | PASS / FAIL | | |
| Cyclomatic complexity | PASS / FAIL | | |
| No magic numbers | PASS / FAIL | | |
| No hardcoded credentials | PASS / FAIL | | |
| Parameterised queries | PASS / FAIL | | |
| Input validation | PASS / FAIL | | |
| No dynamic exec | PASS / FAIL | | |
| Unit test present | PASS / FAIL | | |
| Edge cases covered | PASS / FAIL | | |
| No circular imports | PASS / FAIL | | |
| Thin controllers | PASS / FAIL | | |
| No TODOs | PASS / FAIL | | |
| No commented-out code | PASS / FAIL | | |

**Must fix before merge:**
- [list only if BLOCK or REQUEST_CHANGES]

**Suggested next step:**
- [if BLOCK: specific fix command or action]
- [if APPROVE: anything worth noting for future]

---

## Prompt — Security Audit

You are a security engineer conducting a focused audit against the OWASP Top-10. Return a structured finding report.

### Code to Audit

```
[PASTE YOUR CODE HERE — focus on auth, payments, data access, or user input handling]
```

### Output Format

**VERDICT:** PASS | WARN | FAIL  
**Risk Level:** LOW | MEDIUM | HIGH | CRITICAL  
**Summary:** [one sentence]

**Findings:**

| OWASP Category | Status | Finding | Line | Recommendation |
|---|---|---|---|---|
| A01 — Broken Access Control | PASS / FAIL | | | |
| A02 — Cryptographic Failures | PASS / FAIL | | | |
| A03 — Injection | PASS / FAIL | | | |
| A04 — Insecure Design | PASS / FAIL | | | |
| A05 — Security Misconfiguration | PASS / FAIL | | | |
| A06 — Vulnerable Components | PASS / FAIL | | | |
| A07 — Auth / Session Failures | PASS / FAIL | | | |
| A08 — Software Integrity Failures | PASS / FAIL | | | |
| A09 — Logging / Monitoring Failures | PASS / FAIL | | | |
| A10 — Server-Side Request Forgery | PASS / FAIL | | | |

**Critical findings (FAIL verdict triggers):**
- [list issues that must be fixed before merge]

---

## What to Do with the Verdict

| Verdict | Action |
|---|---|
| **APPROVE** | Safe to merge. Record score for calibration tracking. |
| **REQUEST_CHANGES** | Fix listed issues, re-run Judge to verify. |
| **BLOCK** | Do not merge. Fix critical issues. Consider handing the fix to Copilot with the findings list. |
| **PASS** (security) | Safe to merge for security concerns. |
| **WARN** (security) | Fix before next release cycle. |
| **FAIL** (security) | Block merge. Critical security issue must be resolved. |

---

## Severity Reference

| Severity | Meaning | Default triggers |
|---|---|---|
| **error** | Merge blocker → BLOCK | Security rules, critical testing gaps |
| **warn** | Should fix → REQUEST_CHANGES | Code quality, architecture rules |
| **info** | Observation — does not affect verdict | Style, minor improvements |

---

## Customising the Rubric

Add team-specific rules to `team_standards.md` and paste them into the rubric placeholder above.

| Stack | Example addition |
|---|---|
| React / TypeScript | No `any` types — use proper interfaces |
| Python / FastAPI | All endpoints have Pydantic request/response models |
| Java / Spring | No `@Autowired` on fields — use constructor injection |
| Go | All errors handled — no blank `_` for error returns |
| Node.js / Express | All async route handlers have error middleware |
