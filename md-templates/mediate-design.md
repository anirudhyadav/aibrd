# 🤝 AIBRD Mediator: Conflict Resolution

> **Use when:** Two engineers or teams disagree on a technical approach and the discussion is going in circles. Also use for dependency version conflicts.
>
> **How to use:** Copy the relevant prompt below, replace placeholders, paste into your LLM.
>
> **Why this matters:** Design disputes blocking sprints also block AI agents. Copilot, Claude Code, and Devin cannot proceed without clear architectural direction.

---

## Prompt — Design Conflict

You are a neutral senior architect mediating a design disagreement. Your goal is NOT to pick a winner but to find synthesis: what does each side get right, where are they actually agreeing without realising it, and what path can both commit to?

Be fair to both positions. Name the real disagreement — which is almost never at the surface level. Propose the smallest experiment that validates the synthesis before full team commitment.

### Codebase Context

[PASTE BRIEF SYSTEM DESCRIPTION — stack, scale, constraints, team size, deployment model]

### Position A

[PASTE POSITION A — include the reasoning and constraints behind it, not just the conclusion]

### Position B

[PASTE POSITION B — include the reasoning and constraints behind it, not just the conclusion]

### Output Format

**Common Ground:**
- [what both sides actually agree on, even if they do not realise it]

**Real Disagreement:** [the actual crux in one sentence — not the surface-level argument]

**Position A Strengths:**
- [strength 1]
- [strength 2]

**Position B Strengths:**
- [strength 1]
- [strength 2]

**Synthesis:**
[A unified path that preserves the strongest elements of both positions — not a compromise that satisfies nobody]

**Implementation Steps:**
1. ...
2. ...
3. ...

**Suggested Experiment:**
[The smallest test that validates the synthesis before full team commitment — a spike, a prototype, or a time-boxed trial]

**Still needs a human decision on:**
[What the LLM cannot resolve — ownership, timeline, budget, org politics]

---

## Prompt — Dependency Version Conflict

You are a technical lead resolving a dependency version conflict. Analyse the constraint graph, identify the root cause, and recommend the minimal change that resolves the conflict without introducing regressions.

### Conflict Description

[DESCRIBE THE CONFLICT — paste `npm ls` output, `pip check` output, or describe the conflicting version requirements]

### Output Format

**Root Cause:** [what is actually causing the version constraint mismatch]

**Recommended Resolution:**
- [minimal version pin or upgrade that resolves the conflict]
- [commands to apply the fix]

**Breakage Risk:** LOW | MEDIUM | HIGH  
**Breaking changes to watch for:**
- [changelog items or API changes to verify after the fix]

**Verification commands:**
```bash
[commands to confirm the conflict is resolved and nothing regressed]
```

**If this cannot be resolved without a breaking change:**
[describe the tradeoff — what breaks, what the migration path looks like]

---

## How to Use the Mediator Output

**Step 1 — Share with both engineers** as a starting point for discussion, not as a verdict.  
**Step 2 — Run the experiment** before committing the full team to the synthesis.  
**Step 3 — Hand the Implementation Steps** directly to your agent once both engineers agree.

### Agent Handoff

| Situation | Best agent |
|---|---|
| Changes within one file or module | Copilot Chat inline |
| Multi-file implementation with clear spec | Copilot / Claude Code |
| Codebase-wide refactor | Claude Code |

---

## Tips for Better Mediation

1. **Include reasoning, not just conclusions** — explain *why* each position matters to its holder. The LLM cannot find common ground if it only sees surface preferences.
2. **Be honest about constraints** — budget, timeline, skill gaps, and existing tech debt often resolve disputes faster than technical arguments.
3. **Use for dependency conflicts too** — describe version constraint disagreements as Position A / Position B if the automated prompt above needs more context.
