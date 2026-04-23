import * as vscode from 'vscode'
import { validateAibrdDir, formatValidationReport } from '../core/analyzers/validator'
import { getAibrdDir } from '../workspace/detector'
import { writeFile } from '../workspace/writer'

export async function commandValidateContext(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const result = validateAibrdDir(aibrdDir)
  const report = formatValidationReport(result, aibrdDir)

  writeFile(`${aibrdDir}/validation-report.md`, report)

  const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
  await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

  if (result.passed) {
    vscode.window.showInformationMessage('aibrd: Validation passed ✅ No errors found.')
  } else {
    const errors = result.issues.filter(i => i.severity === 'error').length
    const warnings = result.issues.filter(i => i.severity === 'warning').length
    vscode.window.showWarningMessage(
      `aibrd: Validation found ${errors} error(s), ${warnings} warning(s). See .aibrd/validation-report.md`
    )
  }
}
