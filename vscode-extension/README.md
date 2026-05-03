# AIBRD VS Code Extension — Judgment Layer

> `@judge`, `@advocate`, and `@mediator` as Copilot Chat participants.  
> Automatic multi-LLM routing per role. No API keys. Uses your org's existing Copilot licence.

---

## Prerequisites

- VS Code 1.93+
- GitHub Copilot (Business or Enterprise) with Copilot Chat enabled
- Node.js 18+ (build only — not needed after install)
- At least one of: Claude, GPT-4o, or Gemini enabled in your Copilot plan

---

## Build and Install

```bash
cd vscode-extension
npm install
npm run compile
npm run package
code --install-extension aibrd-0.1.0.vsix
```

Restart VS Code. Open Copilot Chat (`Ctrl+Shift+I` / `Cmd+Shift+I`). Type `@judge` to confirm install.

### Org-Wide Deployment

Build the `.vsix` once and distribute it via your internal config repo or MDM:

```bash
# 1. Build
npm run package   # produces aibrd-0.1.0.vsix

# 2. Host in your internal repo (e.g. your-org/aibrd-config/releases/)

# 3. Each developer installs:
code --install-extension aibrd-0.1.0.vsix
```

---

## The Six Modes

### ⚖ Judge

```
@judge /review #file:src/payments/processor.ts
@judge /review #file:src/auth/login.ts Focus on the session handling logic
@judge /security #file:src/auth/token.ts
```

Returns: `APPROVE / REQUEST_CHANGES / BLOCK` with a scored rubric and severity-graded findings.  
Without `/security`, defaults to `/review`.

### 📐 Advocate

```
@advocate /devil I want to replace our message queue with direct HTTP calls between services
@advocate /devil We should migrate from our monolith to microservices because our team is growing
@advocate /adr   We will adopt Redis Streams for our event pipeline instead of Kafka
```

`/devil` returns: Risk score + `PROCEED / REVISE / RECONSIDER` gate.  
`/adr` returns: Full Architecture Decision Record with anticipated objections.

**Recommended workflow:** Run `/devil` first. If `PROCEED`, then run `/adr`.

### 🤝 Mediator

```
@mediator /design
  Position A: use in-process caching because our team knows Redis well
  Position B: use DynamoDB-only because we already pay for it and it's serverless
  Constraint: solution must survive a us-east-1 outage

@mediator /deps npm ls shows react-query@4 required by package-a, tanstack-query@5 required by package-b
```

`/design` returns: Common ground, real crux, both sides' strengths, synthesis path, validation experiment.  
`/deps` returns: Root cause, minimal version pins, breakage risk, verification commands.

---

## Multi-LLM Routing

The extension automatically selects the best available model for each role. No configuration needed.

| Role | First choice | Falls back to | Then tries |
|---|---|---|---|
| Judge: Review | Claude | GPT-4o | Gemini |
| Judge: Security | Claude | GPT-4o | Gemini |
| Advocate: ADR | GPT-4o | Claude | Gemini |
| Advocate: Devil | Claude | GPT-4o | Gemini |
| Mediator: Design | Claude | GPT-4o | Gemini |
| Mediator: Deps | GPT-4o | Claude | Gemini |

To check which model was selected: VS Code Output panel → "GitHub Copilot Chat".

To override the model preference, edit `ROLE_MODEL_PREFERENCES` in `src/extension.ts` and rebuild.

---

## Providing Context

**From active file** (default — no `#file` needed):
```
@judge /review
```
The extension reads the active editor's content automatically.

**From a specific file:**
```
@judge /review #file:src/payments/processor.ts
```

**Selected code only:**
Select lines in the editor, then:
```
@judge /security
```
The extension uses the selection instead of the full file.

**With codebase context for Advocate:**
```
@advocate /adr #file:README.md We will adopt GraphQL for our client-facing API
```
The README provides system context for the ADR.

---

## Team Customization

The system prompts are defined in `src/prompts.ts`. To customize the rubric for your team:

1. Edit the rubric section of `JUDGE_REVIEW_SYSTEM` in `src/prompts.ts`
2. Rebuild: `npm run compile && npm run package`
3. Redistribute the new `.vsix` to your team

For a faster iteration cycle before baking prompts into the extension, use the MD templates in `../md-templates/` — same rubric, no rebuild required.

---

## Updating the Extension

When the rubric changes or new prompt versions are released:

```bash
# 1. Edit src/prompts.ts
# 2. Rebuild
npm run compile && npm run package  # bump version in package.json first
# 3. Distribute new .vsix to the team
# 4. Each developer reinstalls:
code --install-extension aibrd-0.2.0.vsix
```

---

## File Structure

```
vscode-extension/
├── README.md                  ← this file
├── package.json               ← registers @judge, @advocate, @mediator participants
├── tsconfig.json
└── src/
    ├── extension.ts           ← participant handlers + multi-LLM routing
    └── prompts.ts             ← 6 baked-in system prompts (edit rubric here)
```
