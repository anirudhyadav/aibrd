import * as vscode from 'vscode'

// ── BRD Layer imports ──────────────────────────────────────────────────────
import { commandInit } from './commands/init'
import { commandUpdate } from './commands/update'
import { commandGenerateTests } from './commands/generateTests'
import { commandReleaseNotes } from './commands/releaseNotes'
import { commandChangeImpact } from './commands/changeImpact'
import { commandValidateContext } from './commands/validateContext'
import { commandPrDraft } from './commands/prDraft'
import { commandSprintFeed } from './commands/sprintFeed'
import { commandApiContracts } from './commands/apiContracts'
import { commandPoReport } from './commands/poReport'
import { commandComplianceMapper } from './commands/complianceMapper'
import { commandIngestConfluence } from './commands/ingestConfluence'
import { commandStaleDetector } from './commands/staleDetector'
import { commandTestLinkage } from './commands/testLinkage'
import { registerChatParticipant } from './chat/participant'
import { RtmTreeProvider } from './views/RtmTreeProvider'
import { showGapReport } from './views/GapReportView'

// ── Judgment Layer imports ─────────────────────────────────────────────────
import {
    JUDGE_REVIEW_SYSTEM,
    JUDGE_SECURITY_SYSTEM,
    ADVOCATE_ADR_SYSTEM,
    ADVOCATE_DEVIL_SYSTEM,
    MEDIATOR_DESIGN_SYSTEM,
    MEDIATOR_DEPS_SYSTEM,
} from './prompts'

// ─────────────────────────────────────────────────────────────────
//  Multi-LLM routing for Judgment Layer
//  Each role is assigned the model best suited to its task.
//  No API keys — uses org's existing Copilot licence.
// ─────────────────────────────────────────────────────────────────

type ModelFamily = 'claude' | 'gpt-4o' | 'gemini' | 'gpt-4'
type JudgmentRole = 'judge' | 'judge-security' | 'advocate-adr' | 'advocate-devil' | 'mediator-design' | 'mediator-deps'

const ROLE_MODEL_PREFERENCES: Record<JudgmentRole, ModelFamily[]> = {
    'judge':           ['claude', 'gpt-4o', 'gemini'],
    'judge-security':  ['claude', 'gpt-4o', 'gemini'],
    'advocate-adr':    ['gpt-4o', 'claude', 'gemini'],   // GPT-4o: structured ADR format
    'advocate-devil':  ['claude', 'gpt-4o', 'gemini'],   // Claude: adversarial reasoning
    'mediator-design': ['claude', 'gpt-4o', 'gemini'],   // Claude: synthesis
    'mediator-deps':   ['gpt-4o', 'claude', 'gemini'],   // GPT-4o: version constraint logic
}

const FAMILY_ID_MAP: Record<ModelFamily, string[]> = {
    'claude':  ['claude-3.5-sonnet', 'claude-3.5', 'claude-3', 'claude'],
    'gpt-4o':  ['gpt-4o'],
    'gemini':  ['gemini-2', 'gemini-1.5', 'gemini'],
    'gpt-4':   ['gpt-4'],
}

// ── Judgment Layer helpers ─────────────────────────────────────────────────

function getActiveCode(): { code: string; fileName: string } | undefined {
    const editor = vscode.window.activeTextEditor
    if (!editor) { return undefined }
    const sel = editor.selection
    const code = sel.isEmpty ? editor.document.getText() : editor.document.getText(sel)
    return { code, fileName: editor.document.fileName }
}

async function selectModelForRole(role: JudgmentRole): Promise<vscode.LanguageModelChat | undefined> {
    const copilotModels = await vscode.lm.selectChatModels({ vendor: 'copilot' })
    for (const family of ROLE_MODEL_PREFERENCES[role]) {
        for (const substr of FAMILY_ID_MAP[family]) {
            const match = copilotModels.find(m =>
                m.id.toLowerCase().includes(substr) ||
                m.family?.toLowerCase().includes(substr)
            )
            if (match) { return match }
        }
    }
    if (copilotModels.length > 0) { return copilotModels[0] }
    const all = await vscode.lm.selectChatModels()
    return all[0]
}

function modelLabel(model: vscode.LanguageModelChat): string {
    const id = model.id.toLowerCase()
    if (id.includes('claude')) { return '🤖 Claude' }
    if (id.includes('gpt-4o')) { return '🤖 GPT-4o' }
    if (id.includes('gemini')) { return '🤖 Gemini' }
    return `🤖 ${model.id}`
}

function isUri(v: unknown): v is vscode.Uri {
    return v !== null && v !== undefined && typeof v === 'object' &&
        'fsPath' in (v as object) && 'scheme' in (v as object)
}

async function streamResponse(
    model: vscode.LanguageModelChat,
    messages: vscode.LanguageModelChatMessage[],
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    try {
        const res = await model.sendRequest(messages, {}, token)
        for await (const chunk of res.text) { stream.markdown(chunk) }
    } catch (err) {
        if (err instanceof vscode.LanguageModelError) {
            stream.markdown(`**Model error (${err.code}):** ${err.message}\n\n> Check that GitHub Copilot is active.`)
        } else if (err instanceof Error) {
            stream.markdown(`**Error:** ${err.message}`)
        } else {
            stream.markdown('**An unknown error occurred.** Please try again.')
        }
    }
}

// ── ⚖ Judge handler ────────────────────────────────────────────────────────

async function handleJudge(
    request: vscode.ChatRequest,
    _ctx: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const role: JudgmentRole = request.command === 'security' ? 'judge-security' : 'judge'
    const model = await selectModelForRole(role)
    if (!model) {
        stream.markdown('**Error:** No language model available. Make sure GitHub Copilot is active.')
        return
    }

    const systemPrompt = request.command === 'security' ? JUDGE_SECURITY_SYSTEM : JUDGE_REVIEW_SYSTEM
    const label = request.command === 'security' ? '🔒 Security Audit' : '⚖ Code Review'

    let codeContent = ''
    let fileName = 'unknown'
    const fileRefs = request.references.filter(r => r.id === 'vscode.file')
    if (fileRefs.length > 0) {
        for (const ref of fileRefs) {
            if (!isUri(ref.value)) { continue }
            const doc = await vscode.workspace.openTextDocument(ref.value)
            codeContent += `\n// File: ${ref.value.fsPath}\n${doc.getText()}\n`
            fileName = ref.value.fsPath
        }
    } else {
        const active = getActiveCode()
        if (!active) {
            stream.markdown('**No code to review.** Open a file or use `#file` to reference one.')
            return
        }
        codeContent = active.code
        fileName = active.fileName
    }

    const maxChars = 12000
    if (codeContent.length > maxChars) {
        const cut = codeContent.lastIndexOf('\n', maxChars)
        codeContent = codeContent.substring(0, cut > 0 ? cut : maxChars) + '\n\n[... truncated ...]'
    }

    stream.markdown(`**${label}** · \`${fileName}\` · ${modelLabel(model)}\n\n---\n\n`)
    const userPrompt = request.prompt
        ? `${request.prompt}\n\n## Code\n\`\`\`\n${codeContent}\n\`\`\``
        : `Review this code:\n\n\`\`\`\n${codeContent}\n\`\`\``

    await streamResponse(model, [
        vscode.LanguageModelChatMessage.System(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ], stream, token)
}

// ── 📐 Advocate handler ────────────────────────────────────────────────────

async function handleAdvocate(
    request: vscode.ChatRequest,
    _ctx: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const isDevil = request.command === 'devil'
    const role: JudgmentRole = isDevil ? 'advocate-devil' : 'advocate-adr'
    const model = await selectModelForRole(role)
    if (!model) {
        stream.markdown('**Error:** No language model available. Make sure GitHub Copilot is active.')
        return
    }

    if (!request.prompt?.trim()) {
        stream.markdown(isDevil
            ? '**Provide a proposal to stress-test.**\n\nExample: `@advocate /devil We should replace our message queue with direct HTTP calls because...`'
            : '**Provide a proposal for the ADR.**\n\nExample: `@advocate /adr We will adopt Redis Streams for our event pipeline because...`')
        return
    }

    const label = isDevil ? '👿 Devil\'s Advocate' : '📐 ADR Generator'
    stream.markdown(`**${label}** · ${modelLabel(model)}\n\n---\n\n`)

    let context = ''
    for (const ref of request.references.filter(r => r.id === 'vscode.file')) {
        if (!isUri(ref.value)) { continue }
        const doc = await vscode.workspace.openTextDocument(ref.value)
        context += `\n## Codebase Context (${ref.value.fsPath})\n${doc.getText().substring(0, 6000)}\n`
    }

    const userPrompt = context
        ? `${context}\n\n## Proposal\n${request.prompt}`
        : `## Proposal\n${request.prompt}`

    await streamResponse(model, [
        vscode.LanguageModelChatMessage.System(isDevil ? ADVOCATE_DEVIL_SYSTEM : ADVOCATE_ADR_SYSTEM),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ], stream, token)
}

// ── 🤝 Mediator handler ────────────────────────────────────────────────────

async function handleMediator(
    request: vscode.ChatRequest,
    _ctx: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const isDeps = request.command === 'deps'
    const role: JudgmentRole = isDeps ? 'mediator-deps' : 'mediator-design'
    const model = await selectModelForRole(role)
    if (!model) {
        stream.markdown('**Error:** No language model available. Make sure GitHub Copilot is active.')
        return
    }

    if (!request.prompt?.trim()) {
        stream.markdown(isDeps
            ? '**Describe the dependency conflict.**\n\nExample: `@mediator /deps react-query@4 conflicts with tanstack-query@5`'
            : '**Provide both positions and constraints.**\n\nExample: `@mediator /design Position A: Redis. Position B: DynamoDB. Constraint: must survive regional outage`')
        return
    }

    const label = isDeps ? '📦 Dependency Conflict Resolution' : '🤝 Design Conflict Mediation'
    stream.markdown(`**${label}** · ${modelLabel(model)}\n\n---\n\n`)

    let context = ''
    for (const ref of request.references.filter(r => r.id === 'vscode.file')) {
        if (!isUri(ref.value)) { continue }
        const doc = await vscode.workspace.openTextDocument(ref.value)
        context += `\n## Context from ${ref.value.fsPath}\n${doc.getText().substring(0, 6000)}\n`
    }

    const userPrompt = context ? `${context}\n\n${request.prompt}` : request.prompt

    await streamResponse(model, [
        vscode.LanguageModelChatMessage.System(isDeps ? MEDIATOR_DEPS_SYSTEM : MEDIATOR_DESIGN_SYSTEM),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ], stream, token)
}

// ── Extension lifecycle ────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
    const rtmProvider = new RtmTreeProvider()

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('aibrd.rtmView', rtmProvider),

        // ── BRD Layer: Core ───────────────────────────────────────────────
        vscode.commands.registerCommand('aibrd.init',             () => commandInit(context)),
        vscode.commands.registerCommand('aibrd.update',           () => commandUpdate()),
        vscode.commands.registerCommand('aibrd.generateTests',    () => commandGenerateTests()),
        vscode.commands.registerCommand('aibrd.releaseNotes',     () => commandReleaseNotes()),
        vscode.commands.registerCommand('aibrd.showRtm',          () => rtmProvider.refresh()),
        vscode.commands.registerCommand('aibrd.showGaps', () => {
            const tokenSource = new vscode.CancellationTokenSource()
            return showGapReport(tokenSource.token)
        }),

        // ── BRD Layer: Analysis & Quality ─────────────────────────────────
        vscode.commands.registerCommand('aibrd.changeImpact',     () => commandChangeImpact(context)),
        vscode.commands.registerCommand('aibrd.validateContext',  () => commandValidateContext()),
        vscode.commands.registerCommand('aibrd.prDraft',          () => commandPrDraft()),

        // ── BRD Layer: Delivery Tools ─────────────────────────────────────
        vscode.commands.registerCommand('aibrd.sprintFeed',       () => commandSprintFeed()),
        vscode.commands.registerCommand('aibrd.apiContracts',     () => commandApiContracts()),
        vscode.commands.registerCommand('aibrd.poReport',         () => commandPoReport()),
        vscode.commands.registerCommand('aibrd.complianceMapper', () => commandComplianceMapper()),

        // ── BRD Layer: Ingestion & Traceability ───────────────────────────
        vscode.commands.registerCommand('aibrd.ingestConfluence', () => commandIngestConfluence()),
        vscode.commands.registerCommand('aibrd.staleDetector',    () => commandStaleDetector()),
        vscode.commands.registerCommand('aibrd.testLinkage',      () => commandTestLinkage()),

        vscode.workspace.onDidSaveTextDocument(doc => {
            if (doc.fileName.includes('.aibrd')) { rtmProvider.refresh() }
        }),

        // ── Judgment Layer: @judge ─────────────────────────────────────────
        (() => {
            const judge = vscode.chat.createChatParticipant('aibrd.judge', handleJudge)
            judge.iconPath = new vscode.ThemeIcon('law')
            return judge
        })(),

        // ── Judgment Layer: @advocate ──────────────────────────────────────
        (() => {
            const advocate = vscode.chat.createChatParticipant('aibrd.advocate', handleAdvocate)
            advocate.iconPath = new vscode.ThemeIcon('megaphone')
            return advocate
        })(),

        // ── Judgment Layer: @mediator ──────────────────────────────────────
        (() => {
            const mediator = vscode.chat.createChatParticipant('aibrd.mediator', handleMediator)
            mediator.iconPath = new vscode.ThemeIcon('git-merge')
            return mediator
        })(),
    )

    // BRD Layer: @aibrd chat participant
    registerChatParticipant(context)
}

export function deactivate(): void {}
