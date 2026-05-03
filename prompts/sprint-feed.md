# AIBRD — Sprint Feed: CONTEXT.md → Sprint Tasks

> **Use when:** You need to break CONTEXT.md requirements into sprint-ready task cards with story points and acceptance criteria.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Copy the output into `.aibrd/sprint-feed.md` in your repo.

---

## Prompt

You are a scrum master and technical lead. Given a CONTEXT.md living specification, generate a sprint feed: a prioritised list of development tasks mapped directly to requirement IDs, with story point estimates and ready-to-use acceptance criteria.

Each task must trace back to at least one requirement ID. Do not invent tasks that have no grounding in the spec.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE — or the subset of requirements you want to sprint-plan]
```

### Sprint Context (optional)

```
[PASTE ANY SPRINT CONSTRAINTS — sprint goal, team size, velocity (story points per sprint), tech stack, any requirements already in progress or deferred]
```

### Output Format

Produce the following sections in order:

---

## Sprint Goal

[One sentence describing what this sprint delivers in business terms]

---

## Task Backlog

### TASK-001 — [Task Name]

| Field | Value |
|---|---|
| **Requirement IDs** | BF-001, BR-002 |
| **Type** | Feature / Bug / Spike / Chore |
| **Story Points** | [1 / 2 / 3 / 5 / 8 / 13] |
| **Priority** | Must-have / Should-have / Nice-to-have |
| **Assigned to** | [Role: Backend / Frontend / Full-stack / QA] |

**Description:**
[2–3 sentences explaining what needs to be built and why — link to the business flow or rule it implements]

**Acceptance Criteria:**
- [ ] Given [context] / When [action] / Then [outcome] — maps to AC-001
- [ ] Given [context] / When [action] / Then [outcome] — maps to AC-002
- [ ] Edge case: [description]

**Definition of Done:**
- [ ] Unit tests pass
- [ ] Requirement IDs referenced in commit message (e.g. `feat: implement BF-001 payment flow`)
- [ ] Code reviewed
- [ ] `.aibrd/index.md` traceability matrix updated

---

[Repeat TASK-NNN block for each task]

---

## Capacity Summary

| Sprint | Story Points | Tasks | Must-have | Should-have |
|---|---|---|---|---|
| Sprint 1 | [total] | [count] | [count] | [count] |

---

## Deferred Items

Requirements not included in this sprint feed with rationale:

| ID | Requirement | Reason Deferred | Target Sprint |
|---|---|---|---|
| BF-005 | [flow name] | [dependency / complexity / PO decision] | Sprint 2 |

---

## ID Assignment Rules

- Task IDs are `TASK-NNN` — start from `TASK-001` unless a starting number is provided
- Each task must reference at least one `BF-NNN`, `BR-NNN`, or `AC-NNN`
- Story point scale: 1 (trivial) · 2 (small) · 3 (medium) · 5 (large) · 8 (complex) · 13 (epic — split if possible)

---

## After Generating

1. Import task cards into your issue tracker (Jira, Linear, GitHub Issues) — reference the TASK-NNN ID
2. Add requirement IDs to commit messages so `aibrd: Check Requirement Staleness` can track them
3. At sprint end, run `aibrd: Show Gap Report` to verify coverage against the spec
4. Commit `.aibrd/sprint-feed.md` so the traceability trail stays in git
