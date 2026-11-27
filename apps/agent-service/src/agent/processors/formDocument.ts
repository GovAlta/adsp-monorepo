import type { InputProcessor, ProcessLLMRequestArgs } from '@mastra/core/processors';
import { withoutDocumentSectionText } from '../utils/documentOutline';

type Prompt = ProcessLLMRequestArgs['prompt'];
type PromptMessage = Prompt[number];

/**
 * Sends a form build's chat agent only the outline of a large document, in this turn and every later one. The build
 * reads the section text from the request itself, and the agent reads a section with documentExtractTool when it
 * needs the exact wording, so re-sending the whole document with every call would only spend tokens. The message
 * keeps the text, so the prompt injection check still reads it.
 */
export function trimDocumentSectionText(prompt: Prompt): Prompt {
  let changed = false;
  const result = prompt.map((message): PromptMessage => {
    if (message.role !== 'user' || typeof message.content === 'string') {
      return message;
    }

    let trimmed = false;
    const content = message.content.map((part) => {
      if (part.type !== 'text') {
        return part;
      }
      const text = withoutDocumentSectionText(part.text);
      if (text === part.text) {
        return part;
      }
      trimmed = true;
      return { ...part, text };
    });
    changed ||= trimmed;
    return trimmed ? ({ ...message, content } as PromptMessage) : message;
  });

  return changed ? result : prompt;
}

export function createFormDocumentProcessor(): InputProcessor {
  return {
    id: 'form-document-outline',
    name: 'Form document outline',
    processLLMRequest: ({ prompt }) => ({ prompt: trimDocumentSectionText(prompt) }),
  };
}
