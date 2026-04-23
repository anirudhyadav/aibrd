"""API contract derivation — infers REST endpoints from business flows."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Literal

from ..llm.client import call_llm_json
from ..models.outputs import BRDContent


HttpMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]


@dataclass
class ApiEndpoint:
    method: HttpMethod
    path: str
    summary: str
    requirement_id: str
    request_body: dict[str, Any] | None = None
    responses: dict[str, dict[str, Any]] = field(default_factory=dict)


SYSTEM = """You are a solution architect deriving REST API contracts from business flows.
For each business flow, infer the likely REST endpoint(s) required.
Return JSON: { "endpoints": [{
  "method": "POST",
  "path": "/api/v1/payments",
  "summary": "Initiate a payment",
  "requirementId": "PAY-BF-001",
  "requestBody": { "amount": "number", "currency": "string", "paymentMethod": "string" },
  "responses": { "200": { "description": "Payment accepted" }, "400": { "description": "Invalid payload" } }
}]}"""


def derive_api_contracts(content: BRDContent) -> list[ApiEndpoint]:
    flow_summary = "\n\n".join(
        f"{f.id}: {f.name}\n{f.description}\nSteps: {' → '.join(s.description for s in f.steps)}"
        for f in content.flows
    )
    if not flow_summary.strip():
        return []

    raw = call_llm_json(flow_summary, SYSTEM)
    endpoints = []
    for e in raw.get("endpoints", []):
        endpoints.append(ApiEndpoint(
            method=e["method"],
            path=e["path"],
            summary=e["summary"],
            requirement_id=e.get("requirementId", ""),
            request_body=e.get("requestBody"),
            responses=e.get("responses", {}),
        ))
    return endpoints


def format_api_contracts_as_openapi(
    endpoints: list[ApiEndpoint], project_name: str, module_slug: str | None = None
) -> str:
    title = f"{project_name} — {module_slug}" if module_slug else project_name
    lines = [
        'openapi: "3.0.3"',
        "info:",
        f'  title: "{title} API (aibrd draft)"',
        '  version: "0.1.0"',
        '  description: "Auto-derived from BRD requirements. Review before implementation."',
        "paths:",
    ]

    grouped: dict[str, list[ApiEndpoint]] = {}
    for ep in endpoints:
        grouped.setdefault(ep.path, []).append(ep)

    for ep_path, eps in grouped.items():
        lines.append(f'  "{ep_path}":')
        for ep in eps:
            lines.append(f"    {ep.method.lower()}:")
            lines.append(f'      summary: "{ep.summary}"')
            lines.append(f'      description: "Traces: {ep.requirement_id}"')
            op_id = f"{ep.method.lower()}{ep_path.replace('/', '_').replace('{', '').replace('}', '')}"
            lines.append(f'      operationId: "{op_id}"')

            if ep.request_body and ep.method in ("POST", "PUT", "PATCH"):
                lines += [
                    "      requestBody:",
                    "        required: true",
                    "        content:",
                    "          application/json:",
                    "            schema:",
                    "              type: object",
                    "              properties:",
                ]
                for k, v in ep.request_body.items():
                    lines.append(f"                {k}:")
                    lines.append(f"                  type: {v}")

            lines.append("      responses:")
            for code, resp in ep.responses.items():
                lines.append(f'        "{code}":')
                lines.append(f'          description: "{resp.get("description", "")}"')

    return "\n".join(lines)


def format_api_contracts_as_markdown(endpoints: list[ApiEndpoint]) -> str:
    import json
    today = date.today().isoformat()
    lines = [
        "# API Contracts (aibrd draft)",
        f"_Generated: {today} — Review before implementation_",
        "",
    ]

    for ep in endpoints:
        lines.append(f"## `{ep.method} {ep.path}`")
        lines.append(f"**{ep.summary}**")
        lines.append(f"_Traces: {ep.requirement_id}_")
        lines.append("")

        if ep.request_body:
            lines += ["**Request Body:**", "```json", json.dumps(ep.request_body, indent=2), "```", ""]

        lines.append("**Responses:**")
        for code, resp in ep.responses.items():
            lines.append(f"- `{code}`: {resp.get('description', '')}")
        lines.append("")

    return "\n".join(lines)
