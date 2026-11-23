import type { AgentExecutionOptions } from '@mastra/core/agent';
import type { User } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import { environment } from '../../../environments/environment';
import { PDF_GENERATION_AGENT_MAX_STEPS } from '../../model/executionLimits';
import { buildPdfInstructions, PDF_CLOSING_FILE_INSTRUCTIONS, PDF_CLOSING_INSTRUCTIONS } from './instructions';
import { describeTemplate } from './templateView';
import { PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL, PdfDefinitionReader } from './types';

const TEMPLATE_VIEW_KEY = 'pdfTemplateView';
// The user messages, counted back from the newest, whose files keep the file instructions in the prompt: a design
// reference is usually followed by a reply to the agent's "replace it?" question.
const FILE_USER_MESSAGES = 2;

interface StepRequestContext {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

interface MessagePart {
  type?: string;
  text?: string;
}

interface StoredMessage {
  role?: string;
  content?: string | { parts?: MessagePart[] };
}

interface StepToolResult {
  toolName?: string;
  isError?: boolean;
  result?: unknown;
  payload?: { toolName?: string; isError?: boolean; result?: unknown };
}

interface Step {
  text?: string;
  toolResults?: unknown[];
}

export interface PdfStepArgs {
  messages?: readonly unknown[];
  steps?: readonly unknown[];
  requestContext?: StepRequestContext;
}

function partsOf(message: StoredMessage): MessagePart[] {
  return typeof message.content === 'object' && Array.isArray(message.content?.parts) ? message.content.parts : [];
}

function hasFile(message: StoredMessage): boolean {
  return partsOf(message).some(
    (part) =>
      part.type === 'file' ||
      part.type === 'image' ||
      (part.type === 'text' && /file service URN/i.test(part.text ?? '')),
  );
}

/** Whether one of the latest user messages carries a file, so the file instructions are needed. */
export function hasRecentFile(messages: readonly unknown[]): boolean {
  return (messages as StoredMessage[])
    .filter((message) => message?.role === 'user')
    .slice(-FILE_USER_MESSAGES)
    .some(hasFile);
}

/** Whether the step saved the template. */
export function savedIn(step?: Step): boolean {
  return ((step?.toolResults ?? []) as StepToolResult[]).some((toolResult) => {
    const name = toolResult?.toolName ?? toolResult?.payload?.toolName;
    const isError = toolResult?.isError ?? toolResult?.payload?.isError;
    const result = toolResult?.result ?? toolResult?.payload?.result;
    return name === PDF_UPDATE_TOOL && !isError && !(result instanceof Error);
  });
}

/** Ends the turn after a step that saved the template and already told the user what changed. */
export function savedWithReply({ steps }: { steps: readonly Step[] }): boolean {
  const step = steps[steps.length - 1];
  return savedIn(step) && !!step?.text?.trim();
}

async function loadTemplateView(
  requestContext: StepRequestContext | undefined,
  readDefinition: PdfDefinitionReader,
  logger?: Logger,
): Promise<string | undefined> {
  if (!requestContext) {
    return undefined;
  }

  // Read once per request: a retry after a rejected save needs the same template, and failing once is enough.
  const cached = requestContext.get(TEMPLATE_VIEW_KEY);
  if (typeof cached === 'string') {
    return cached || undefined;
  }

  let view = '';
  try {
    const definition = await readDefinition(requestContext);
    view = definition ? describeTemplate(definition) : '';
  } catch (err) {
    logger?.warn('Unable to read the PDF template for the agent prompt; the agent will retrieve it with its tool.', {
      context: 'PdfTemplateAgent',
      error: err instanceof Error ? err.message : String(err),
    });
  }
  requestContext.set(TEMPLATE_VIEW_KEY, view);
  return view || undefined;
}

function today(): string {
  const now = new Date();
  return `${now.toISOString().split('T')[0]} (${now.toLocaleDateString('en-US', { weekday: 'long' })})`;
}

/**
 * Builds each model call of the PDF template agent: short instructions, with the file section only while a file is
 * part of the conversation, and the saved template itself, so the agent can edit and save in one call without first
 * retrieving it. After a save that came without a reply, the closing call needs neither the template nor the tools.
 */
export async function preparePdfStep(
  { messages = [], steps = [], requestContext }: PdfStepArgs,
  readDefinition: PdfDefinitionReader,
  logger?: Logger,
) {
  const withFiles = hasRecentFile(messages);
  if (savedIn(steps[steps.length - 1] as Step | undefined)) {
    const closing = withFiles
      ? `${PDF_CLOSING_INSTRUCTIONS} ${PDF_CLOSING_FILE_INSTRUCTIONS}`
      : PDF_CLOSING_INSTRUCTIONS;
    return {
      activeTools: [] as string[],
      systemMessages: [{ role: 'system' as const, content: closing }],
    };
  }

  const user = requestContext?.get('user') as User | undefined;
  const instructions = buildPdfInstructions({
    withFiles,
    date: today(),
    userName: user?.name,
  });
  const view = await loadTemplateView(requestContext, readDefinition, logger);

  return {
    activeTools: view ? [PDF_UPDATE_TOOL] : [PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL],
    systemMessages: [
      { role: 'system' as const, content: instructions },
      ...(view ? [{ role: 'system' as const, content: view }] : []),
    ],
  };
}

export function createPdfSupervisorOptions(
  logger: Logger,
  readDefinition: PdfDefinitionReader,
): AgentExecutionOptions<undefined> {
  return {
    maxSteps: PDF_GENERATION_AGENT_MAX_STEPS,
    // With an OpenAI-compatible endpoint the reply limit is a provider option (see getAgentProviderOptions).
    ...(environment.MODEL_URL ? {} : { modelSettings: { maxOutputTokens: environment.AGENT_PDF_MAX_OUTPUT_TOKENS } }),
    stopWhen: savedWithReply,
    prepareStep: (args: unknown) => preparePdfStep(args as PdfStepArgs, readDefinition, logger),
  } as AgentExecutionOptions<undefined>;
}
