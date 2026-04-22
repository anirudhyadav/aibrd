import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { Actor } from '../models/outputs'

const SYSTEM = `You are a business analyst extracting actors from a BRD.
An actor is any person, system, or role that interacts with the system.
Return JSON: { "actors": [{ "name": "...", "description": "..." }] }`

export async function extractActors(
  brdText: string,
  token?: vscode.CancellationToken
): Promise<Omit<Actor, 'id'>[]> {
  const result = await callLLMJson<{ actors: Omit<Actor, 'id'>[] }>(
    brdText,
    SYSTEM,
    token
  )
  return result.actors
}
