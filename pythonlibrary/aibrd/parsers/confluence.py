"""Confluence page ingestion — fetch BRD content directly from Confluence Cloud or Server/DC."""

from __future__ import annotations
import base64
import re
import urllib.request
import urllib.parse
import json
from dataclasses import dataclass

from ..models.brd import RawBRD


@dataclass
class ConfluenceConfig:
    base_url: str        # e.g. https://yourorg.atlassian.net
    space_key: str       # e.g. ENG
    token: str           # API token or PAT
    page_id: str | None = None
    page_title: str | None = None
    email: str | None = None   # Atlassian Cloud: email + token; Server/DC: token only


def _auth_header(cfg: ConfluenceConfig) -> str:
    if cfg.email:
        creds = base64.b64encode(f"{cfg.email}:{cfg.token}".encode()).decode()
        return f"Basic {creds}"
    return f"Bearer {cfg.token}"


def _fetch_json(url: str, auth: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": auth, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def _strip_html(html: str) -> str:
    html = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</p>", "\n\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</li>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"</h[1-6]>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]+>", "", html)
    html = html.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ")
    return re.sub(r"\n{3,}", "\n\n", html).strip()


def _resolve_page_id(cfg: ConfluenceConfig, auth: str) -> str:
    if cfg.page_id:
        return cfg.page_id
    title = urllib.parse.quote(cfg.page_title or "")
    url = f"{cfg.base_url}/wiki/rest/api/content?spaceKey={cfg.space_key}&title={title}&expand=version"
    data = _fetch_json(url, auth)
    results = data.get("results", [])
    if not results:
        raise ValueError(f"No Confluence page found titled '{cfg.page_title}' in space '{cfg.space_key}'")
    return results[0]["id"]


def ingest_confluence_page(cfg: ConfluenceConfig) -> RawBRD:
    """Fetch a Confluence page (+ direct children) and return as RawBRD."""
    auth = _auth_header(cfg)
    page_id = _resolve_page_id(cfg, auth)

    url = f"{cfg.base_url}/wiki/rest/api/content/{page_id}?expand=body.storage,version,ancestors"
    page = _fetch_json(url, auth)
    title = page["title"]
    body = _strip_html(page["body"]["storage"]["value"])
    text = f"# {title}\n\n{body}"

    # Pull direct children
    children_url = f"{cfg.base_url}/wiki/rest/api/content/{page_id}/child/page?expand=body.storage&limit=50"
    try:
        children_data = _fetch_json(children_url, auth)
        for child in children_data.get("results", []):
            child_body = _strip_html(child["body"]["storage"]["value"])
            text += f"\n\n## {child['title']}\n\n{child_body}"
    except Exception:
        pass  # children optional

    source = f"confluence:{cfg.base_url}/wiki/spaces/{cfg.space_key}/pages/{page_id}"
    filename = re.sub(r"[^a-zA-Z0-9]", "_", title) + ".confluence"
    return RawBRD(text=text, source=source, filename=filename)
