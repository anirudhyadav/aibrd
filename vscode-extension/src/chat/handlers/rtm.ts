import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { getAibrdDir } from '../../workspace/detector'

export async function handleRtm(
  _request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  _token: vscode.CancellationToken
): Promise<void> {
  const aibrdDir = getAibrdDir()
  const indexPath = path.join(aibrdDir, 'index.md')

  if (!fs.existsSync(indexPath)) {
    stream.markdown('No RTM found. Run **aibrd: Initialize from BRD** first.')
    return
  }

  const content = fs.readFileSync(indexPath, 'utf-8')
  stream.markdown(content)
}
