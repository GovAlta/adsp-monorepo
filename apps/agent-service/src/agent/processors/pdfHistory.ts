import type { InputProcessor, ProcessLLMRequestArgs } from '@mastra/core/processors';
import { PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL } from '../agents/pdf/types';

type Prompt = ProcessLLMRequestArgs['prompt'];
type PromptMessage = Prompt[number];
type ContentPart = { type: string; toolCallId?: string; toolName?: string; input?: unknown; output?: { type: string } };

export const EARLIER_TEMPLATE_NOTE = 'Retrieved earlier. The current template is in the system message.';
export const EARLIER_SAVE_NOTE = 'Done earlier. The current template is in the system message.';
export const SAVED_NOTE = 'Saved.';
export const FIELDS_LEFT_OUT_NOTE = 'Field values left out of this request.';
export const EARLIER_FILE_NOTE = '[A file from an earlier turn is left out of this request.]';
// Text this long in an older user message is a file's extracted content rather than something the user typed.
const LONG_TEXT = 4000;

const isError = (part: ContentPart) => part.output?.type === 'error-text' || part.output?.type === 'error-json';

function savedFields(input: unknown): string[] {
  return input && typeof input === 'object'
    ? Object.entries(input as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string')
        .map(([field]) => field)
    : [];
}

function userTurnStarts(prompt: Prompt): number[] {
  return prompt.flatMap((message, index) => (message.role === 'user' ? [index] : []));
}

/**
 * The PDF template agent gets the saved template in its system message on every call, so copies of the template in
 * earlier tool calls and results only repeat it, and a save that worked needs no more than a note. The fields of a
 * rejected save in the current turn stay, because the retry must send all of them again. Files from turns before the
 * previous one are left out. Only the request to the model changes; the thread keeps everything.
 */
export function trimPdfHistory(prompt: Prompt): Prompt {
  const starts = userTurnStarts(prompt);
  const currentTurn = starts.length ? starts[starts.length - 1] : 0;
  const previousTurn = starts.length >= 2 ? starts[starts.length - 2] : 0;

  const rejectedCalls = new Set<string>();
  prompt.forEach((message, index) => {
    if (index > currentTurn && message.role === 'tool') {
      for (const part of message.content as ContentPart[]) {
        if (part.type === 'tool-result' && part.toolName === PDF_UPDATE_TOOL && isError(part) && part.toolCallId) {
          rejectedCalls.add(part.toolCallId);
        }
      }
    }
  });

  let changed = false;
  const result = prompt.map((message, index): PromptMessage => {
    const earlier = index < currentTurn;
    if (message.role === 'assistant') {
      const content = (message.content as ContentPart[]).map((part) => {
        if (
          part.type !== 'tool-call' ||
          part.toolName !== PDF_UPDATE_TOOL ||
          rejectedCalls.has(part.toolCallId ?? '')
        ) {
          return part;
        }
        changed = true;
        return { ...part, input: { savedFields: savedFields(part.input), note: FIELDS_LEFT_OUT_NOTE } };
      });
      return { ...message, content } as PromptMessage;
    }

    if (message.role === 'tool') {
      const content = (message.content as ContentPart[]).map((part) => {
        if (
          part.type !== 'tool-result' ||
          !part.toolName ||
          ![PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL].includes(part.toolName)
        ) {
          return part;
        }
        if (!earlier && (part.toolName === PDF_RETRIEVAL_TOOL || isError(part))) {
          return part;
        }
        changed = true;
        const value = !earlier
          ? SAVED_NOTE
          : part.toolName === PDF_RETRIEVAL_TOOL
            ? EARLIER_TEMPLATE_NOTE
            : EARLIER_SAVE_NOTE;
        return { ...part, output: { type: 'text' as const, value } };
      });
      return { ...message, content } as PromptMessage;
    }

    if (message.role === 'user' && index < previousTurn && Array.isArray(message.content)) {
      const content = (message.content as Array<ContentPart & { text?: string }>).map((part) => {
        if (part.type === 'file' || (part.type === 'text' && (part.text?.length ?? 0) > LONG_TEXT)) {
          changed = true;
          return { type: 'text' as const, text: EARLIER_FILE_NOTE };
        }
        return part;
      });
      return { ...message, content } as PromptMessage;
    }

    return message;
  });

  return changed ? (result as Prompt) : prompt;
}

export function createPdfHistoryProcessor(): InputProcessor {
  return {
    id: 'pdf-history',
    name: 'PDF template history',
    processLLMRequest: ({ prompt }) => ({ prompt: trimPdfHistory(prompt) }),
  };
}
