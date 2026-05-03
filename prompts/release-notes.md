# AIBRD — Generate Release Notes from git diff + CONTEXT.md

> **Use when:** You're preparing a release and want notes that map shipped code back to the requirement IDs the business asked for.
>
> **How to use:** Run `git log v1.0..HEAD --oneline` and `git diff v1.0..HEAD`, copy the outputs. Copy everything below the `---` divider, replace placeholders, paste into your LLM.

---

## Prompt

You are a release manager and technical writer. Given a git diff (or commit log) and a CONTEXT.md living specification, generate release notes that:
- Map every code change to the requirement ID(s) it delivers
- Are readable by the PO and business stakeholders (plain English, no jargon)
- Include a technical summary for the engineering team
- Flag any requirements that were in scope but are NOT covered by this release

### git log (commit history for this release)

```
[PASTE THE OUTPUT OF: git log <previous-tag>..HEAD --oneline]
```

### git diff (optional — for more detail)

```
[PASTE THE OUTPUT OF: git diff <previous-tag>..HEAD --stat]
```

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE — or the Business Flows and Acceptance Criteria sections]
```

### Release Context (optional)

```
[PASTE ANY ADDITIONAL CONTEXT — release version number, release date, target audience, any known deferred items, hotfixes included]
```

### Output Format

---

## Release Notes — v[VERSION] — [DATE]

### What's New (Business Summary)

Plain English for PO and stakeholders — no technical jargon:

- **[Feature name]** — [1 sentence description of business value delivered] _(BF-001, BF-002)_
- **[Feature name]** — [description] _(BF-005)_

---

### Requirements Delivered

| Req ID | Type | Requirement | Status |
|---|---|---|---|
| BF-001 | Business Flow | [name] | ✅ Shipped |
| BR-003 | Business Rule | [name] | ✅ Shipped |
| AC-007 | Acceptance Criterion | [criterion] | ✅ Verified |

---

### Bug Fixes

| # | Description | Req ID (if applicable) |
|---|---|---|
| 1 | [fix description] | BR-007 |

---

### Technical Changes

For the engineering team:

| Change | Files Affected | Req IDs |
|---|---|---|
| [technical description] | `src/payments/processor.ts` | BF-005 |

---

### Deferred — Not in This Release

Requirements that were in scope but did not ship:

| Req ID | Requirement | Reason | Target Release |
|---|---|---|---|
| BF-008 | [flow name] | [dependency / descoped / deferred by PO] | v1.1 |

---

### Known Issues

| # | Description | Workaround | Target Fix |
|---|---|---|---|
| 1 | [issue] | [workaround if any] | v[N] |

---

### Upgrade Notes

[Any breaking changes, migration steps, config changes required — or write "None" if clean upgrade]

---

## After Generating

1. Save to `.aibrd/releases/v[VERSION].md` and commit
2. Share the "What's New (Business Summary)" section with the PO for sign-off
3. For any deferred items — update the sprint feed and flag staleness risk
4. Tag the release in git: `git tag -a v[VERSION] -m "Release v[VERSION]"`
