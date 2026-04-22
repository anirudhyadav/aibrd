"""
LLM client — auto-detects provider from environment variables.

Priority:
  1. ANTHROPIC_API_KEY  → Claude (claude-sonnet-4-5 default)
  2. GITHUB_TOKEN       → GitHub Models API (OpenAI-compatible, free with GH account)
  3. OPENAI_API_KEY     → OpenAI (gpt-4o default)

Set AIBRD_MODEL to override the default model for any provider.
"""

import json
import os
from typing import Any


def _detect_provider() -> str:
    if os.getenv("ANTHROPIC_API_KEY"):
        return "anthropic"
    if os.getenv("GITHUB_TOKEN"):
        return "github"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    raise EnvironmentError(
        "No LLM provider configured.\n"
        "Set one of:\n"
        "  ANTHROPIC_API_KEY  — for Claude (recommended)\n"
        "  GITHUB_TOKEN       — for GitHub Models (free with GitHub account)\n"
        "  OPENAI_API_KEY     — for OpenAI\n"
    )


def _default_model(provider: str) -> str:
    defaults = {
        "anthropic": "claude-sonnet-4-5",
        "github": "gpt-4o-mini",
        "openai": "gpt-4o",
    }
    return os.getenv("AIBRD_MODEL", defaults[provider])


def call_llm(prompt: str, system: str) -> str:
    provider = _detect_provider()
    model = _default_model(provider)

    if provider == "anthropic":
        return _call_anthropic(prompt, system, model)
    elif provider == "github":
        return _call_github_models(prompt, system, model)
    else:
        return _call_openai(prompt, system, model)


def call_llm_json(prompt: str, system: str) -> Any:
    json_system = system + "\n\nRespond with valid JSON only. No markdown, no explanation."
    raw = call_llm(prompt, json_system)
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(cleaned)


def _call_anthropic(prompt: str, system: str, model: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model=model,
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _call_github_models(prompt: str, system: str, model: str) -> str:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://models.inference.ai.azure.com",
        api_key=os.environ["GITHUB_TOKEN"],
    )
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""


def _call_openai(prompt: str, system: str, model: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""
