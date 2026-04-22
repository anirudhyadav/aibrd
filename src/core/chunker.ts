import * as vscode from 'vscode'
import { BRDChunk, RawBRD } from './models/brd'

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function chunkBRD(brd: RawBRD): BRDChunk[] {
  const config = vscode.workspace.getConfiguration('aibrd')
  const maxTokens: number = config.get('maxChunkTokens') ?? 6000
  const maxChars = maxTokens * 4

  if (brd.text.length <= maxChars) {
    return [{ text: brd.text, index: 0, total: 1 }]
  }

  const paragraphs = brd.text.split(/\n{2,}/)
  const chunks: BRDChunk[] = []
  let current = ''
  let overlap = ''

  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para
    if (estimateTokens(candidate) > maxTokens && current) {
      chunks.push({ text: overlap + current, index: chunks.length, total: 0 })
      // carry last paragraph as overlap for context continuity
      overlap = current.split('\n\n').slice(-1)[0] + '\n\n'
      current = para
    } else {
      current = candidate
    }
  }

  if (current) {
    chunks.push({ text: overlap + current, index: chunks.length, total: 0 })
  }

  return chunks.map(c => ({ ...c, total: chunks.length }))
}
