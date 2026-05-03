# 👿 AIBRD Advocate: Devil's Advocate Review

> **Use when:** You are about to commit to a design decision — stress-test it before handing off to Copilot, Claude Code, or Devin for implementation. Run this **before** generating an ADR.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM.
>
> **Why this matters:** The most expensive architectural mistakes surface after implementation. This prompt forces the LLM to argue *against* your proposal — finding weaknesses while the cost of changing direction is still low.

---

## Prompt

You are a rigorous, constructive senior engineer. Argue AGAINST the proposal below. Find every legitimate weakness, risk, and hidden assumption.

Be rigorous, not contrarian — only raise issues that would concern a senior engineer in a real design review. Do not invent unlikely scenarios to pad the list. Acknowledge genuine strengths of the proposal: a fair devil's advocate is more credible than a purely negative one.

### Proposal

[PASTE YOUR DESIGN PROPOSAL, REFACTOR PLAN, OR LIBRARY CHOICE HERE — include tech choices, scale expectations, constraints, and alternatives you have already ruled out]

### Output Format

**Risk Score:** [0-100]/100  
**Verdict:** PROCEED | REVISE | RECONSIDER

**Critical Flaws:**
- [flaw] → [impact if not addressed]

**Hidden Assumptions:**
- [assumption the proposal takes for granted that may not hold in production]

**Failure Scenarios:**

| Scenario | Likelihood | Impact |
|---|---|---|
| [scenario] | low / med / high | [what breaks] |

**Minimum changes needed before this can PROCEED:**
- [populate only if verdict is REVISE or RECONSIDER]
- [leave empty if PROCEED]

**What this proposal gets right:**
- [genuine strengths — required, not optional]

---

## Gate Rule — Before Agent Handoff

This is the decision gate before handing any design to an AI agent for implementation:

| Verdict | Action |
|---|---|
| **PROCEED** | Safe to generate the ADR (`advocate-adr.md`) and hand off to Copilot / Claude Code / Devin |
| **REVISE** | Address the minimum changes listed. Re-run Devil's Advocate. |
| **RECONSIDER** | Escalate to architecture review. Do not hand off to agents — the proposal needs fundamental rethinking. |

```
Your proposal
      │
      ▼
Devil's Advocate
      │
  ┌───┴────────┐──────────────┐
  ▼            ▼              ▼
PROCEED      REVISE       RECONSIDER
  │            │              │
  ▼            ▼              ▼
Generate     Fix &         Escalate to
ADR          re-run        architecture
  │                        review
  ▼
Hand off
to agents
```

---

## Tips for Better Results

1. **Be specific in your proposal** — vague proposals get vague criticism. Include tech choices, scale expectations, team size, and constraints.
2. **Include what you have already considered** — tell the LLM what alternatives you rejected and why. This forces it to find *new* weaknesses rather than suggesting obvious alternatives.
3. **Run it twice with different framing** — paste the same proposal but add *"Focus on operational risks"* or *"Focus on security implications"* to get different angles.
4. **Use it for library choices too** — not just architecture decisions. "We want to replace X with Y" is a valid proposal.
