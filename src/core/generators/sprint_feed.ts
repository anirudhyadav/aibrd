import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { BRDContent } from '../models/outputs'

export interface SprintTask {
  id: string
  title: string
  requirementIds: string[]
  acceptanceCriteria: string[]
  storyPoints: number
  priority: 'high' | 'medium' | 'low'
  module?: string
}

const SYSTEM = `You are a senior tech lead converting business requirements into sprint tasks.
For each business flow or feature, create a developer task with:
- A clear action title (verb-first)
- Which requirement IDs it covers
- Acceptance criteria (from AC-XXX items)
- Story point estimate (1, 2, 3, 5, 8, 13)
- Priority based on dependencies (high/medium/low)
Return JSON: { "tasks": [{ "title": "...", "requirementIds": ["BF-001"], "acceptanceCriteria": ["..."], "storyPoints": 3, "priority": "high" }] }`

export async function generateSprintFeed(
  content: BRDContent,
  token?: vscode.CancellationToken
): Promise<SprintTask[]> {
  const brdSummary = [
    ...content.flows.map(f => `${f.id}: ${f.name} — ${f.description}`),
    ...content.rules.map(r => `${r.id}: ${r.description}`),
    ...content.criteria.map(ac => `${ac.id}: Given ${ac.given} / When ${ac.when} / Then ${ac.then}`)
  ].join('\n')

  const raw = await callLLMJson<{ tasks: Omit<SprintTask, 'id'>[] }>(brdSummary, SYSTEM, token)
  return raw.tasks.map((t, i) => ({
    ...t,
    id: `TASK-${String(i + 1).padStart(3, '0')}`,
    module: content.moduleSlug
  }))
}

export function formatSprintFeed(tasks: SprintTask[], projectName: string): string {
  const today = new Date().toISOString().split('T')[0]
  const total = tasks.reduce((s, t) => s + t.storyPoints, 0)

  const lines = [
    `# Sprint Feed — ${projectName}`,
    `_Generated: ${today} | ${tasks.length} tasks · ${total} story points_`,
    ''
  ]

  const byPriority = ['high', 'medium', 'low'] as const
  for (const p of byPriority) {
    const filtered = tasks.filter(t => t.priority === p)
    if (!filtered.length) continue

    const emoji = p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'
    lines.push(`## ${emoji} ${p.charAt(0).toUpperCase() + p.slice(1)} Priority`, '')

    for (const task of filtered) {
      lines.push(`### ${task.id}: ${task.title}`)
      lines.push(`**Story Points:** ${task.storyPoints}`)
      if (task.module) lines.push(`**Module:** ${task.module}`)
      lines.push(`**Traces:** ${task.requirementIds.join(', ')}`)
      if (task.acceptanceCriteria.length) {
        lines.push('**Acceptance Criteria:**')
        task.acceptanceCriteria.forEach(ac => lines.push(`- [ ] ${ac}`))
      }
      lines.push('')
    }
  }

  lines.push('## Summary Table', '')
  lines.push('| Task | Priority | Points | Requirements |')
  lines.push('|---|---|---|---|')
  for (const t of tasks) {
    lines.push(`| ${t.id}: ${t.title} | ${t.priority} | ${t.storyPoints} | ${t.requirementIds.join(', ')} |`)
  }

  return lines.join('\n')
}

export function formatSprintFeedAsGithubIssues(tasks: SprintTask[]): string {
  return tasks.map(t => JSON.stringify({
    title: `[${t.id}] ${t.title}`,
    body: [
      `**Traces:** ${t.requirementIds.join(', ')}`,
      `**Story Points:** ${t.storyPoints}`,
      '',
      '## Acceptance Criteria',
      ...t.acceptanceCriteria.map(ac => `- [ ] ${ac}`)
    ].join('\n'),
    labels: [t.priority, t.module ?? 'general'].filter(Boolean)
  })).join('\n')
}
