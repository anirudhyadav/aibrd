import * as vscode from 'vscode';
import {
    JUDGE_REVIEW_SYSTEM,
    JUDGE_SECURITY_SYSTEM,
    ADVOCATE_ADR_SYSTEM,
    ADVOCATE_DEVIL_SYSTEM,
    MEDIATOR_DESIGN_SYSTEM,
    MEDIATOR_DEPS_SYSTEM,
} from './prompts';

// ─────────────────────────────────────────────────────────────────
//  Model Preferences per Role
//
//  Each role is assigned the model best suited to its task.
//  The extension tries each preference in order, then falls back
//  to any available Copilot model. No API keys required — uses
//  your org's existing Copilot licence.
//
//  ⚖  Judge     → Claude   (nuanced reasoning, catches subtle logic errors)
//  📐  Advocate  → GPT-4o   (structured document generation, ADR format)
//  👿  Devil     → Claude   (adversarial reasoning, hidden assumptions)
//  🤝  Mediator  → Claude   (synthesis, finding common ground)
//
//  To change model preferences, edit ROLE_MODEL_PREFERENCES below.
// ─────────────────────────────────────────────────────────────────

type ModelFamily = 'claude' | 'gpt-4o' | 'gemini' | 'gpt-4';
type Role = 'judge' | 'judge-security' | 'advocate-adr' | 'advocate-devil' | 'mediator-design' | 'mediator-deps';

const ROLE_MODEL_PREFERENCES: Record<Role, ModelFamily[]> = {
    'judge':           ['claude', 'gpt-4o', 'gemini'],
    'judge-security':  ['claude', 'gpt-4o', 'gemini'],
    'advocate-adr':    ['gpt-4o', 'claude', 'gemini'],   // GPT-4o: reliable ADR structure
    'advocate-devil':  ['claude', 'gpt-4o', 'gemini'],   // Claude: adversarial reasoning
    'mediator-design': ['claude', 'gpt-4o', 'gemini'],   // Claude: synthesis and common ground
    'mediator-deps':   ['gpt-4o', 'claude', 'gemini'],   // GPT-4o: precise version constraint logic
};

const FAMILY_ID_MAP: Record<ModelFamily, string[]> = {
    'claude':  ['claude-3.5-sonnet', 'claude-3.5', 'claude-3', 'claude'],
    'gpt-4o':  ['gpt-4o'],
    'gemini':  ['gemini-2', 'gemini-1.5', 'gemini'],
    'gpt-4':   ['gpt-4'],
};

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────

function getActiveCode(): { code: string; fileName: string } | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return undefined; }
    const selection = editor.selection;
    const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);
    return { code, fileName: editor.document.fileName };
}

async function selectModelForRole(role: Role): Promise<vscode.LanguageModelChat | undefined> {
    const allCopilotModels = await vscode.lm.selectChatModels({ vendor: 'copilot' });

    for (const family of ROLE_MODEL_PREFERENCES[role]) {
        for (const substr of FAMILY_ID_MAP[family]) {
            const match = allCopilotModels.find(m =>
                m.id.toLowerCase().includes(substr.toLowerCase()) ||
                m.family?.toLowerCase().includes(substr.toLowerCase())
            );
            if (match) { return match; }
        }
    }

    if (allCopilotModels.length > 0) { return allCopilotModels[0]; }

    const allModels = await vscode.lm.selectChatModels();
    return allModels[0];
}

function modelLabel(model: vscode.LanguageModelChat): string {
    const id = model.id.toLowerCase();
    if (id.includes('claude'))  { return '🤖 Claude'; }
    if (id.includes('gpt-4o'))  { return '🤖 GPT-4o'; }
    if (id.includes('gemini'))  { return '🤖 Gemini'; }
    if (id.includes('gpt-4'))   { return '🤖 GPT-4'; }
    return `🤖 ${model.id}`;
}

function isUri(value: unknown): value is vscode.Uri {
    return (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        'fsPath' in (value as object) &&
        'scheme' in (value as object)
    );
}

async function streamResponse(
    model: vscode.LanguageModelChat,
    messages: vscode.LanguageModelChatMessage[],
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    try {
        const response = await model.sendRequest(messages, {}, token);
        for await (const chunk of response.text) {
            stream.markdown(chunk);
        }
    } catch (err) {
        if (err instanceof vscode.LanguageModelError) {
            stream.markdown(
                `**Model error (${err.code}):** ${err.message}\n\n` +
                `> Try again, or check that GitHub Copilot is active and the model is available.`
            );
        } else if (err instanceof Error) {
            stream.markdown(`**Unexpected error:** ${err.message}`);
        } else {
            stream.markdown('**An unknown error occurred.** Please try again.');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
//  ⚖  Judge Handler
// ─────────────────────────────────────────────────────────────────

async function handleJudge(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const role: Role = request.command === 'security' ? 'judge-security' : 'judge';
    const model = await selectModelForRole(role);
    if (!model) {
        stream.markdown('**Error:** No language model available. Make sure GitHub Copilot is active.');
        return;
    }

    const systemPrompt = request.command === 'security' ? JUDGE_SECURITY_SYSTEM : JUDGE_REVIEW_SYSTEM;
    const commandLabel = request.command === 'security' ? '🔒 Security Audit' : '⚖ Code Review';

    let codeContent = '';
    let fileName = 'unknown';

    const fileRefs = request.references.filter(ref => ref.id === 'vscode.file');
    if (fileRefs.length > 0) {
        for (const ref of fileRefs) {
            if (!isUri(ref.value)) { continue; }
            const uri = ref.value;
            const doc = await vscode.workspace.openTextDocument(uri);
            codeContent += `\n// File: ${uri.fsPath}\n${doc.getText()}\n`;
            fileName = uri.fsPath;
        }
    } else {
        const active = getActiveCode();
        if (!active) {
            stream.markdown('**No code to review.** Open a file or use `#file` to reference one.');
            return;
        }
        codeContent = active.code;
        fileName = active.fileName;
    }

    // Truncate at a clean line boundary to avoid sending a syntactically broken snippet.
    const maxChars = 12000;
    if (codeContent.length > maxChars) {
        const cutPoint = codeContent.lastIndexOf('\n', maxChars);
        codeContent = codeContent.substring(0, cutPoint > 0 ? cutPoint : maxChars) + '\n\n[... truncated ...]';
    }

    stream.markdown(`**${commandLabel}** · \`${fileName}\` · ${modelLabel(model)}\n\n---\n\n`);

    const userPrompt = request.prompt
        ? `${request.prompt}\n\n## Code\n\`\`\`\n${codeContent}\n\`\`\``
        : `Review this code:\n\n\`\`\`\n${codeContent}\n\`\`\``;

    const messages = [
        vscode.LanguageModelChatMessage.System(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ];

    await streamResponse(model, messages, stream, token);
}

// ─────────────────────────────────────────────────────────────────
//  📐  Advocate Handler
// ─────────────────────────────────────────────────────────────────

async function handleAdvocate(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const isDevil = request.command === 'devil';
    const role: Role = isDevil ? 'advocate-devil' : 'advocate-adr';
    const model = await selectModelForRole(role);
    if (!model) {
        stream.markdown('**Error:** No language model available. Make sure GitHub Copilot is active.');
        return;
    }

    const systemPrompt = isDevil ? ADVOCATE_DEVIL_SYSTEM : ADVOCATE_ADR_SYSTEM;
    const commandLabel = isDevil ? '👿 Devil\'s Advocate' : '📐 ADR Generator';

    if (!request.prompt || request.prompt.trim().length === 0) {
        stream.markdown(isDevil
            ? '**Provide a proposal to stress-test.** Example:\n\n`@advocate /devil We should migrate from REST to GraphQL for our client-facing API because...`'
            : '**Provide a proposal for the ADR.** Example:\n\n`@advocate /adr We will adopt Redis Streams instead of Kafka for our event pipeline because...`');
        return;
    }

    stream.markdown(`**${commandLabel}** · ${modelLabel(model)}\n\n---\n\n`);

    let context = '';
    const fileRefs = request.references.filter(ref => ref.id === 'vscode.file');
    for (const ref of fileRefs) {
        if (!isUri(ref.value)) { continue; }
        const uri = ref.value;
        const doc = await vscode.workspace.openTextDocument(uri);
        context += `\n## Codebase Context (${uri.fsPath})\n${doc.getText().substring(0, 6000)}\n`;
    }

    const userPrompt = context
        ? `${context}\n\n## Proposal\n${request.prompt}`
        : `## Proposal\n${request.prompt}`;

    const messages = [
        vscode.LanguageModelChatMessage.System(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ];

    await streamResponse(model, messages, stream, token);
}

// ─────────────────────────────────────────────────────────────────
//  🤝  Mediator Handler
// ─────────────────────────────────────────────────────────────────

async function handleMediator(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
): Promise<void> {
    const isDeps = request.command === 'deps';
    const role: Role = isDeps ? 'mediator-deps' : 'mediator-design';
    const model = await selectModelForRole(role);
    if (!model) {
        stream.markdown('**Error:** No language model available. Make sure GitHub Copilot is active.');
        return;
    }

    const systemPrompt = isDeps ? MEDIATOR_DEPS_SYSTEM : MEDIATOR_DESIGN_SYSTEM;
    const commandLabel = isDeps ? '📦 Dependency Conflict Resolution' : '🤝 Design Conflict Mediation';

    if (!request.prompt || request.prompt.trim().length === 0) {
        stream.markdown(isDeps
            ? '**Describe the dependency conflict.** Example:\n\n`@mediator /deps Package A requires lodash >=4.17.21 but Package B pins lodash@4.17.15`'
            : '**Provide both positions and any constraints.** Example:\n\n`@mediator /design Position A: Redis for session storage. Position B: DynamoDB. Constraint: must survive regional outage`');
        return;
    }

    stream.markdown(`**${commandLabel}** · ${modelLabel(model)}\n\n---\n\n`);

    let context = '';
    const fileRefs = request.references.filter(ref => ref.id === 'vscode.file');
    for (const ref of fileRefs) {
        if (!isUri(ref.value)) { continue; }
        const uri = ref.value;
        const doc = await vscode.workspace.openTextDocument(uri);
        context += `\n## Context from ${uri.fsPath}\n${doc.getText().substring(0, 6000)}\n`;
    }

    const userPrompt = context ? `${context}\n\n${request.prompt}` : request.prompt;

    const messages = [
        vscode.LanguageModelChatMessage.System(systemPrompt),
        vscode.LanguageModelChatMessage.User(userPrompt),
    ];

    await streamResponse(model, messages, stream, token);
}

// ─────────────────────────────────────────────────────────────────
//  Extension Lifecycle
// ─────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
    const judge = vscode.chat.createChatParticipant('aibrd.judge', handleJudge);
    judge.iconPath = new vscode.ThemeIcon('law');

    const advocate = vscode.chat.createChatParticipant('aibrd.advocate', handleAdvocate);
    advocate.iconPath = new vscode.ThemeIcon('megaphone');

    const mediator = vscode.chat.createChatParticipant('aibrd.mediator', handleMediator);
    mediator.iconPath = new vscode.ThemeIcon('git-merge');

    context.subscriptions.push(judge, advocate, mediator);
}

export function deactivate(): void {}
