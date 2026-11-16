import type { InputProcessor, ProcessLLMRequestArgs } from '@mastra/core/processors';

type Prompt = ProcessLLMRequestArgs['prompt'];

export const EARLIER_RESULT_NOTE =
  'Shown to the user as a card in an earlier turn. Call the tool again if you need its details.';

/**
 * Replaces the tool results of turns before the previous one with a short note. The user saw each result as a card
 * when it arrived, and a follow-up question usually needs only the previous turn's results, so older ones are dead
 * weight on every later call. Only the request to the model changes; the thread keeps every result.
 */
export function trimEarlierToolResults(prompt: Prompt): Prompt {
  const userIndexes = prompt.flatMap((message, index) => (message.role === 'user' ? [index] : []));
  const previousTurnStart = userIndexes.length >= 2 ? userIndexes[userIndexes.length - 2] : 0;

  let trimmed = false;
  const result = prompt.map((message, index) => {
    if (index >= previousTurnStart || message.role !== 'tool') {
      return message;
    }

    trimmed = true;
    return {
      ...message,
      content: message.content.map((part) =>
        part.type === 'tool-result' ? { ...part, output: { type: 'text' as const, value: EARLIER_RESULT_NOTE } } : part,
      ),
    };
  });

  return trimmed ? (result as Prompt) : prompt;
}

export function createAccessHistoryProcessor(): InputProcessor {
  return {
    id: 'access-history',
    name: 'Access Service history',
    processLLMRequest: ({ prompt }) => ({ prompt: trimEarlierToolResults(prompt) }),
  };
}
