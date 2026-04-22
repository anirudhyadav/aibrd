import * as vscode from 'vscode'
import * as path from 'path'

export interface AnalysisSummary {
  modules: string[]
  flowCount: number
  ruleCount: number
  actorCount: number
  acCount: number
  ambiguityCount: number
  conflictCount: number
  aibrdDir: string
}

export class BrdAnalysisPanel {
  private static currentPanel: BrdAnalysisPanel | undefined
  private readonly panel: vscode.WebviewPanel
  private disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, summary: AnalysisSummary) {
    this.panel = panel
    this.panel.webview.html = this.buildHtml(summary)
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
  }

  static show(context: vscode.ExtensionContext, summary: AnalysisSummary): void {
    if (BrdAnalysisPanel.currentPanel) {
      BrdAnalysisPanel.currentPanel.panel.reveal()
      BrdAnalysisPanel.currentPanel.panel.webview.html =
        BrdAnalysisPanel.currentPanel.buildHtml(summary)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      'aibrdAnalysis',
      'aibrd — Analysis Result',
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    )

    BrdAnalysisPanel.currentPanel = new BrdAnalysisPanel(panel, summary)
    context.subscriptions.push(BrdAnalysisPanel.currentPanel.panel)
  }

  private buildHtml(s: AnalysisSummary): string {
    const moduleRows = s.modules.length > 0
      ? s.modules.map(m => `<li><code>${m}</code></li>`).join('')
      : '<li>flat (single context)</li>'

    const warnings: string[] = []
    if (s.ambiguityCount > 0) warnings.push(`⚠️ ${s.ambiguityCount} ambiguous term(s) — review <code>.aibrd/ambiguity-report.md</code>`)
    if (s.conflictCount > 0) warnings.push(`🔴 ${s.conflictCount} conflict(s) detected — review <code>.aibrd/conflict-report.md</code>`)

    const warningHtml = warnings.length > 0
      ? `<div class="warnings"><ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`
      : '<p class="ok">✅ No ambiguities or conflicts detected.</p>'

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
  h1 { font-size: 1.4em; margin-bottom: 4px; }
  .subtitle { color: var(--vscode-descriptionForeground); font-size: 0.9em; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .card { background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 6px; padding: 12px; }
  .card .num { font-size: 2em; font-weight: bold; }
  .card .label { font-size: 0.8em; color: var(--vscode-descriptionForeground); }
  .warnings { background: var(--vscode-inputValidation-warningBackground); padding: 10px 16px; border-radius: 6px; }
  .ok { color: var(--vscode-terminal-ansiGreen); }
  ul { margin: 4px 0; padding-left: 20px; }
  code { font-family: var(--vscode-editor-font-family); }
</style>
</head>
<body>
<h1>aibrd Initialization Complete</h1>
<p class="subtitle">.aibrd/ folder created and populated</p>

<div class="grid">
  <div class="card"><div class="num">${s.flowCount}</div><div class="label">Business Flows</div></div>
  <div class="card"><div class="num">${s.ruleCount}</div><div class="label">Business Rules</div></div>
  <div class="card"><div class="num">${s.actorCount}</div><div class="label">Actors</div></div>
  <div class="card"><div class="num">${s.acCount}</div><div class="label">Acceptance Criteria</div></div>
  <div class="card"><div class="num">${s.ambiguityCount}</div><div class="label">Ambiguities</div></div>
  <div class="card"><div class="num">${s.conflictCount}</div><div class="label">Conflicts</div></div>
</div>

<h3>Modules Detected</h3>
<ul>${moduleRows}</ul>

<h3>Quality Checks</h3>
${warningHtml}

<h3>Next Steps</h3>
<ul>
  <li>Review <code>.aibrd/CONTEXT.md</code> (or module files)</li>
  <li>Run <strong>aibrd: Generate Test Cases</strong> for QA</li>
  <li>Use <strong>@aibrd tasks</strong> in Copilot Chat for dev tasks</li>
  <li>Run <strong>aibrd: Generate Release Notes</strong> before release</li>
</ul>
</body>
</html>`
  }

  dispose(): void {
    BrdAnalysisPanel.currentPanel = undefined
    this.panel.dispose()
    this.disposables.forEach(d => d.dispose())
  }
}
