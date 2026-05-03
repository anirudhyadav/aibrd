# 📐 AIBRD Advocate: Architecture Decision Record

> **Use when:** You are proposing a design decision and need a structured document for the review meeting.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM.
>
> **Required first step:** Run [`advocate-devil.md`](advocate-devil.md) to stress-test your proposal. Only generate the ADR if the verdict is **PROCEED**. By the time you walk into the design review, you have already had the argument.

---

## Prompt

You are a principal software architect. Write a complete Architecture Decision Record for the proposal below.

Include anticipated review objections with pre-prepared responses — this document will be used in the design review meeting. Be thorough: the engineer presenting this will face questions from architects, engineering managers, and staff engineers who may prefer the current approach.

### Codebase Context

[PASTE YOUR README OR ARCHITECTURE SUMMARY HERE — include stack, scale, team size, existing patterns, and any constraints]

### Proposal

[DESCRIBE YOUR DESIGN DECISION IN 2-5 SENTENCES — be specific about what you are choosing and what you are rejecting]

### Output Format

Write the ADR as a markdown document with these exact sections:

```markdown
# [Title — short noun phrase describing the decision]

**Status:** Proposed   ·   **Date:** [today's date]

## Context
[3-5 sentences: what problem exists, what changed, or what opportunity exists that makes this decision necessary now]

## Decision
[The chosen approach in 1-2 sentences. Start with "We will..."]

## Rationale
- [reason 1 — why this approach over alternatives]
- [reason 2]
- [reason 3]

## Alternatives Considered

### [Alternative A]
[1-2 sentence description]
**Why rejected:** [specific reason — not "it was worse" but the actual constraint]

### [Alternative B]
[1-2 sentence description]
**Why rejected:** [specific reason]

## Trade-offs

| Benefit | Cost |
|---|---|
| [what you gain] | [what you give up or accept] |

## Consequences
[What changes downstream: what this enables, what this constrains, migration path if applicable, who is affected]

## Anticipated Objections

| Objection | Response |
|---|---|
| "Why not just [existing approach]?" | [prepared response] |
| "This adds complexity to [area]" | [prepared response] |
| "What about [scalability / cost / operational concern]?" | [prepared response] |
| "The team doesn't have experience with this" | [prepared response] |
```

---

## The Advocate Workflow

```
1. Write your proposal (2-5 sentences)
         │
         ▼
2. Run Devil's Advocate first (advocate-devil.md)
         │
    ┌────┴──────┐
    │           │
 PROCEED    REVISE / RECONSIDER
    │           │
    │       Revise proposal,
    │       re-run Devil's Advocate
    │
    ▼
3. Generate ADR (this template)
         │
         ▼
4. Review the draft yourself — the LLM's output is a starting point, not a finished document.
   Add your own context and judgment before taking it to the meeting.
         │
         ▼
5. Present at design review
         │
         ▼
6. After approval → hand off to Copilot / Claude Code / Devin:
   "Implement the architecture described in this ADR: [paste ADR]"
```

---

## After Generating the ADR

1. **Review it yourself** — check that the context section accurately describes your situation, not a generic version of it.
2. **Fill in the objections table** with real objections you have heard in previous discussions. The LLM draft is a starting point.
3. **Store it** in your repo under `.aibrd/decisions/ADR-NNN-title.md` so it is versioned alongside the code it affects.
4. **After approval** — paste the ADR into your agent's context window as the specification for implementation.
