# AIBRD — Judgment Layer MD Templates

> Zero setup. Copy a prompt, paste into any LLM, get a structured verdict.

These templates add the AIBRD judgment layer to your workflow without installing anything. They work with GitHub Copilot Chat, Claude.ai, ChatGPT, Gemini, or any LLM.

---

## The Six Templates

| File | Role | Mode | Use When |
|---|---|---|---|
| [`judge-review.md`](judge-review.md) | ⚖ Judge | Code Review | PR is ready — catch issues before merge |
| [`judge-review.md`](judge-review.md) | ⚖ Judge | Security Audit | Auth, payments, or data access code |
| [`advocate-devil.md`](advocate-devil.md) | 👿 Advocate | Devil's Advocate | Before committing to any design |
| [`advocate-adr.md`](advocate-adr.md) | 📐 Advocate | ADR Generator | After devil's advocate says PROCEED |
| [`mediate-design.md`](mediate-design.md) | 🤝 Mediator | Design Conflict | Sprint-blocking disagreement |
| [`mediate-design.md`](mediate-design.md) | 🤝 Mediator | Dependency Conflict | Version constraint mismatch |
| [`team_standards.md`](team_standards.md) | — | Config | Edit once per team |

---

## How to Use

1. Open the relevant `.md` file
2. Copy everything below the `---` divider line
3. Replace all `[PLACEHOLDER]` sections with your content
4. Paste into your LLM of choice
5. Read the verdict — do not accept it uncritically

**That's it. No build step, no API key, no VS Code required.**

---

## Recommended Workflow

```
PR submitted
  → open judge-review.md → paste code → get APPROVE/REQUEST_CHANGES/BLOCK

Design proposal ready
  → open advocate-devil.md → paste proposal → get PROCEED/REVISE/RECONSIDER
      if PROCEED → open advocate-adr.md → generate formal ADR

Sprint blocked by disagreement
  → open mediate-design.md → paste both positions → get synthesis + experiment
```

---

## Team Customization

**`team_standards.md`** is the only file that needs editing per team. It contains the rubric the Judge uses. Customize it once and commit it to your team repo.

```
aibrd/                         ← in your team repo
├── md-templates/
│   ├── judge-review.md        ← unchanged from this repo
│   ├── advocate-adr.md        ← unchanged
│   ├── advocate-devil.md      ← unchanged
│   ├── mediate-design.md      ← unchanged
│   └── team_standards.md      ← edit this one
```

When using the Judge, paste your `team_standards.md` content into the rubric placeholder in `judge-review.md`.

---

## Override Rate

Track how often your team disagrees with the Judge's verdict:

| Rate | Health | Action |
|---|---|---|
| < 5% | Rubber-stamping | Tighten rubric or use on real code |
| 10–25% | Healthy | No action |
| > 30% | Rubric misaligned | Recalibrate — loosen or remove rules |

---

## Graduating to the VS Code Extension

Once the team is convinced the rubric works, the VS Code extension in [`../vscode-extension/`](../vscode-extension/) provides the same six modes as `@judge`, `@advocate`, and `@mediator` participants in Copilot Chat — with automatic multi-LLM routing per role.
