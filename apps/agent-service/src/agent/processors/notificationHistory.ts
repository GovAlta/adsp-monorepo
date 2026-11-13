import type { InputProcessor, ProcessLLMRequestArgs } from '@mastra/core/processors';
import { NOTIFICATION_PROPOSAL_TOOL } from '../tools/notificationTemplate';

type Prompt = ProcessLLMRequestArgs['prompt'];
type PromptMessage = Prompt[number];

export const EARLIER_PROPOSAL_NOTE =
  '[Proposed in an earlier turn and applied in the editor; the current template is in the editor context.]';
export const EARLIER_ATTACHMENT_NOTE = '[Attachment from an earlier message; not shown again.]';
export const EARLIER_LONG_TEXT_NOTE = '[Long content from an earlier message; not shown again.]';

// Subject, title and subtitle are short and stay; bodies are replaced.
const LONG_PROPOSAL_FIELD_CHARS = 300;
// Pasted HTML and extracted document text, but not ordinary questions.
const LONG_USER_TEXT_CHARS = 2000;

function trimProposal(input: unknown): unknown {
  if (typeof input !== 'object' || input === null) {
    return input;
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === 'string' && value.length > LONG_PROPOSAL_FIELD_CHARS ? EARLIER_PROPOSAL_NOTE : value,
    ]),
  );
}

function trimAssistantMessage(message: PromptMessage): PromptMessage {
  if (message.role !== 'assistant' || typeof message.content === 'string') {
    return message;
  }
  return {
    ...message,
    content: message.content.map((part) =>
      part.type === 'tool-call' && part.toolName === NOTIFICATION_PROPOSAL_TOOL
        ? { ...part, input: trimProposal(part.input) }
        : part,
    ),
  } as PromptMessage;
}

function trimUserMessage(message: PromptMessage): PromptMessage {
  if (message.role !== 'user' || typeof message.content === 'string') {
    return message;
  }
  return {
    ...message,
    content: message.content.map((part) => {
      if (part.type === 'file') {
        return { type: 'text' as const, text: EARLIER_ATTACHMENT_NOTE };
      }
      return part.type === 'text' && part.text.length > LONG_USER_TEXT_CHARS
        ? { ...part, text: EARLIER_LONG_TEXT_NOTE }
        : part;
    }),
  } as PromptMessage;
}

/**
 * Shortens earlier turns in the request to the model. The editor sends the current template with every message, and
 * proposals are applied there as they arrive, so the bodies proposed in earlier turns are only stale copies of it.
 * Attachments and pasted content stay for one more turn, since a follow-up often refers to them. Only the request
 * changes; the thread keeps every message.
 */
export function trimEarlierTemplateContent(prompt: Prompt): Prompt {
  const userIndexes = prompt.flatMap((message, index) => (message.role === 'user' ? [index] : []));
  const currentTurnStart = userIndexes.length ? userIndexes[userIndexes.length - 1] : 0;
  const previousTurnStart = userIndexes.length >= 2 ? userIndexes[userIndexes.length - 2] : 0;

  return prompt.map((message, index) => {
    if (index < currentTurnStart && message.role === 'assistant') {
      return trimAssistantMessage(message);
    }
    if (index < previousTurnStart && message.role === 'user') {
      return trimUserMessage(message);
    }
    return message;
  }) as Prompt;
}

export function createNotificationHistoryProcessor(): InputProcessor {
  return {
    id: 'notification-template-history',
    name: 'Notification template history',
    processLLMRequest: ({ prompt }) => ({ prompt: trimEarlierTemplateContent(prompt) }),
  };
}
