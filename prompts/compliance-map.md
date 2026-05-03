# AIBRD — Compliance Mapping: Requirements vs Regulatory Frameworks

> **Use when:** You need to tag requirements against compliance frameworks (GDPR, WCAG, HIPAA, SOX, PCI-DSS, ISO 27001) before a compliance review, audit, or release.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Copy the output into `.aibrd/compliance-map.md` in your repo.

---

## Prompt

You are a compliance architect. Given a CONTEXT.md living specification, map every requirement to the relevant clauses of one or more compliance frameworks. Identify gaps where requirements exist that should have compliance tags but don't, and flag requirements that may create compliance obligations not yet addressed in the spec.

Be specific — cite actual framework clauses (e.g. GDPR Article 17, WCAG 2.1 SC 1.4.3) not just framework names.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE — or the relevant sections]
```

### Frameworks to Map

```
[LIST THE FRAMEWORKS REQUIRED — e.g. GDPR, WCAG 2.1 AA, HIPAA, SOX, PCI-DSS v4.0, ISO 27001:2022]
[If unsure, write "auto-detect" and the LLM will suggest applicable frameworks based on the requirements]
```

### Project Context (optional)

```
[PASTE ANY HELPFUL CONTEXT — industry (healthcare, fintech, etc.), data types handled, geographic markets, existing compliance certifications]
```

### Output Format

Produce the following sections in order:

---

## Compliance Coverage Matrix

| Req ID | Requirement | GDPR | WCAG | HIPAA | SOX | PCI-DSS | ISO 27001 | Notes |
|---|---|---|---|---|---|---|---|---|
| BF-001 | [flow name] | Art. 6(1)(b) | — | — | — | — | A.18.1 | [brief rationale] |
| BR-003 | [rule name] | Art. 17 | — | §164.312 | — | Req 3.4 | — | [brief rationale] |

**Legend:** `—` = not applicable · clause cited = applicable · ⚠️ = gap (obligation exists but requirement doesn't address it)

---

## Framework Summary

### GDPR
| Clause | Article | Requirements Mapped | Status |
|---|---|---|---|
| Lawful basis | Art. 6 | BF-001, BF-002 | ✅ Addressed |
| Right to erasure | Art. 17 | — | ⚠️ Gap — no requirement covers data deletion |
| Data minimisation | Art. 5(1)(c) | BR-004 | ✅ Addressed |

### WCAG 2.1 (repeat block for each framework requested)
| Success Criterion | Level | Requirements Mapped | Status |
|---|---|---|---|
| 1.4.3 Contrast (Minimum) | AA | AC-007 | ✅ Addressed |
| 2.4.3 Focus Order | AA | — | ⚠️ Gap |

### [Additional frameworks — one block per framework]

---

## Compliance Gaps

Requirements that create regulatory obligations not yet addressed in the spec:

| # | Framework | Clause | Obligation | Affected Req IDs | Recommended Action |
|---|---|---|---|---|---|
| 1 | GDPR | Art. 13 | Privacy notice at point of data collection | BF-003 (user registration) | Add BR-NNN: system must display privacy notice before collecting personal data |
| 2 | PCI-DSS | Req 6.4 | Web application firewall required | BF-005 (payment flow) | Add BR-NNN: WAF must be in place for all payment endpoints |

---

## High-Risk Requirements

Requirements that carry the highest compliance exposure:

| Req ID | Requirement | Frameworks | Risk Level | Rationale |
|---|---|---|---|---|
| BF-005 | Payment processing flow | PCI-DSS, GDPR | 🔴 Critical | Handles cardholder data — full PCI-DSS scope applies |
| BR-009 | Audit log retention | SOX, ISO 27001 | 🟡 High | Retention period not specified — creates audit risk |

---

## Recommended New Requirements

Compliance obligations not covered by any current requirement — propose new entries for CONTEXT.md:

| Proposed ID | Type | Requirement | Framework | Clause |
|---|---|---|---|---|
| BR-NEW-001 | Business Rule | All personal data must be encrypted at rest using AES-256 | GDPR, ISO 27001 | Art. 32, A.10.1 |
| BR-NEW-002 | Business Rule | Audit logs must be retained for a minimum of 7 years | SOX | Section 802 |

---

## After Generating

1. Review all ⚠️ gaps with your compliance officer before the next release
2. Add recommended new requirements to CONTEXT.md via the extract-requirements prompt
3. For 🔴 Critical items — schedule a compliance review before shipping to production
4. Commit `compliance-map.md` to `.aibrd/` and include the framework versions audited against
5. Re-run this prompt on each new BRD version to catch regressions
