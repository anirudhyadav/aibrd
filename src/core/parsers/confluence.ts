import * as https from 'https'
import * as http from 'http'
import { RawBRD } from '../models/brd'

export interface ConfluenceConfig {
  baseUrl: string        // e.g. https://yourorg.atlassian.net
  spaceKey: string       // e.g. ENG
  pageId?: string        // specific page ID, or use title search
  pageTitle?: string     // search by title if pageId not given
  token: string          // Confluence API token (PAT or Bearer)
  email?: string         // for cloud: Basic auth email (token = API key)
}

interface ConfluencePage {
  id: string
  title: string
  body: { storage: { value: string } }
  version: { number: number }
  ancestors: Array<{ id: string; title: string }>
}

function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const mod = parsed.protocol === 'https:' ? https : http
    const req = mod.request(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers },
      res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch { reject(new Error(`Non-JSON response from Confluence: ${data.slice(0, 200)}`)) }
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function resolvePageId(cfg: ConfluenceConfig, authHeader: string): Promise<string> {
  if (cfg.pageId) return cfg.pageId

  const title = encodeURIComponent(cfg.pageTitle ?? '')
  const url = `${cfg.baseUrl}/wiki/rest/api/content?spaceKey=${cfg.spaceKey}&title=${title}&expand=version`
  const res = await fetchJson(url, { Authorization: authHeader, Accept: 'application/json' }) as {
    results: Array<{ id: string }>
  }

  if (!res.results?.length) {
    throw new Error(`Confluence: no page found titled "${cfg.pageTitle}" in space "${cfg.spaceKey}"`)
  }
  return res.results[0].id
}

async function fetchChildPages(
  cfg: ConfluenceConfig,
  pageId: string,
  authHeader: string
): Promise<ConfluencePage[]> {
  const url = `${cfg.baseUrl}/wiki/rest/api/content/${pageId}/child/page?expand=body.storage,version,ancestors&limit=50`
  const res = await fetchJson(url, { Authorization: authHeader, Accept: 'application/json' }) as {
    results: ConfluencePage[]
  }
  return res.results ?? []
}

/**
 * Ingest a Confluence page (and its direct children) into a RawBRD.
 * Handles both Confluence Cloud (email+token → Basic) and Server/DC (token → Bearer).
 */
export async function ingestConfluencePage(cfg: ConfluenceConfig): Promise<RawBRD> {
  const authHeader = cfg.email
    ? `Basic ${Buffer.from(`${cfg.email}:${cfg.token}`).toString('base64')}`
    : `Bearer ${cfg.token}`

  const pageId = await resolvePageId(cfg, authHeader)
  const url = `${cfg.baseUrl}/wiki/rest/api/content/${pageId}?expand=body.storage,version,ancestors`
  const page = await fetchJson(url, { Authorization: authHeader, Accept: 'application/json' }) as ConfluencePage

  let text = `# ${page.title}\n\n${stripHtml(page.body.storage.value)}`

  // Also pull direct children to get sub-sections
  const children = await fetchChildPages(cfg, pageId, authHeader)
  for (const child of children) {
    text += `\n\n## ${child.title}\n\n${stripHtml(child.body.storage.value)}`
  }

  const source = `confluence:${cfg.baseUrl}/wiki/spaces/${cfg.spaceKey}/pages/${pageId}`
  return {
    text,
    source,
    filename: `${page.title.replace(/[^a-zA-Z0-9]/g, '_')}.confluence`,
  }
}
