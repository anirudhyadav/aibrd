# AIBRD — MD Prompt Templates (Option A)

> Zero setup. Copy a prompt, paste into any LLM, get structured output.  
> Works with GitHub Copilot Chat, Claude.ai, ChatGPT, Gemini, or any LLM.

---

## The Five Templates

| File | Use when |
|---|---|
| [`extract-requirements.md`](extract-requirements.md) | You have a BRD and need to generate the initial CONTEXT.md |
| [`gap-analysis.md`](gap-analysis.md) | You want to check whether a code file covers its BRD requirements |
| [`sprint-feed.md`](sprint-feed.md) | You need to break CONTEXT.md requirements into sprint tasks |
| [`change-impact.md`](change-impact.md) | A new version of the BRD has arrived and you need to see what changed |
| [`compliance-map.md`](compliance-map.md) | You need to tag requirements against GDPR, WCAG, HIPAA, SOX, or PCI-DSS |

---

## How to Use

1. Open the relevant `.md` file
2. Copy everything below the `---` divider
3. Replace all `[PLACEHOLDER]` sections with your content
4. Paste into your LLM of choice
5. Copy the output into the corresponding `.aibrd/` file in your repo and commit it

**That's it. No build step, no API key, no VS Code required.**

---

## Output Files

Each prompt produces content that maps to a file in `.aibrd/`:

| Prompt | Writes to |
|---|---|
| `extract-requirements.md` | `.aibrd/CONTEXT.md` + `ambiguity-report.md` + `conflict-report.md` |
| `gap-analysis.md` | `.aibrd/` (review only — no file written) |
| `sprint-feed.md` | `.aibrd/sprint-feed.md` |
| `change-impact.md` | `.aibrd/change-impact-report.md` |
| `compliance-map.md` | `.aibrd/compliance-map.md` |

---

## Graduating to the VS Code Extension

Once the team is on GitHub Enterprise + Copilot, the VS Code extension in [`../vscodebase/`](../vscodebase/) automates all of the above — reading BRDs directly, writing `.aibrd/` files, and keeping the traceability matrix updated on every save.
