# AIBRD — Derive API Contracts from Business Flows

> **Use when:** You want to generate an OpenAPI 3.0 YAML spec derived directly from the business flows and rules in CONTEXT.md.
>
> **How to use:** Copy everything below the `---` divider, replace placeholders, paste into your LLM. Copy the YAML output into `.aibrd/openapi.yaml` in your repo.

---

## Prompt

You are a solution architect and API designer. Given a CONTEXT.md living specification, derive an OpenAPI 3.0 YAML contract. Every endpoint must trace back to a business flow ID. Business rules become validation constraints. Acceptance criteria become response examples.

Be precise — do not invent endpoints that have no grounding in the spec. If a business flow implies a webhook or async event rather than a REST call, model it as such.

### CONTEXT.md

```
[PASTE YOUR .aibrd/CONTEXT.md HERE — focus on Business Flows and Business Rules sections]
```

### API Context (optional)

```
[PASTE ANY ADDITIONAL CONTEXT — base URL, authentication scheme (JWT / OAuth2 / API key), versioning strategy, existing endpoints to preserve, response format preferences (JSON / JSON:API / HAL)]
```

### Output Format

Produce the following:

---

## Endpoint Summary

Before the full YAML, list all derived endpoints:

| Method | Path | Business Flow | Description |
|---|---|---|---|
| POST | /payments | BF-005 | Initiate payment — triggers confirmation flow |
| GET | /payments/{id} | BF-006 | Retrieve payment status |
| DELETE | /users/{id} | BF-009 | User data erasure (GDPR Art. 17) |

---

## OpenAPI 3.0 YAML

```yaml
openapi: "3.0.3"
info:
  title: "[System Name] API"
  version: "1.0.0"
  description: "Generated from AIBRD CONTEXT.md — requirement IDs embedded in operation descriptions"

servers:
  - url: "[BASE_URL]"

paths:
  /[endpoint]:
    [method]:
      operationId: "[operationId]"
      summary: "[BF-NNN] — [short description]"
      description: |
        Implements: BF-NNN ([flow name])
        Business Rules: BR-NNN, BR-NNN
        Acceptance Criteria: AC-NNN
      tags:
        - "[tag]"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/[RequestSchema]"
      responses:
        "200":
          description: "[AC-NNN] — [success condition]"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/[ResponseSchema]"
        "400":
          description: "[BR-NNN] — [validation failure]"
        "422":
          description: "[BR-NNN] — [business rule violation]"

components:
  schemas:
    [Schema]:
      type: object
      required:
        - [required fields from BR-NNN]
      properties:
        [field]:
          type: [type]
          description: "[BR-NNN constraint if applicable]"
```

---

## Traceability Index

| Endpoint | Implements | Business Rules Applied | ACs Covered |
|---|---|---|---|
| `POST /payments` | BF-005 | BR-003, BR-004 | AC-008, AC-009 |

---

## Unmapped Flows

Business flows that could not be directly mapped to REST endpoints (async, event-driven, or UI-only):

| BF ID | Flow | Reason | Suggested Approach |
|---|---|---|---|
| BF-007 | Email notification | No REST trigger — event-driven | Model as webhook / async callback |

---

## After Generating

1. Review endpoint list with the architect — confirm REST vs event-driven decisions
2. Save YAML to `.aibrd/openapi.yaml` and commit
3. Validate with: `npx @stoplight/spectral-cli lint .aibrd/openapi.yaml`
4. Import into Postman, Insomnia, or your API gateway for immediate use
5. Re-run when CONTEXT.md changes to keep the contract in sync with the spec
