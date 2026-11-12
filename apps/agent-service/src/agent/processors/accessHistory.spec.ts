import { createAccessHistoryProcessor, EARLIER_RESULT_NOTE, trimEarlierToolResults } from './accessHistory';

const system = { role: 'system' as const, content: 'rules' };
const user = (text: string) => ({ role: 'user' as const, content: [{ type: 'text' as const, text }] });
const call = (id: string) => ({
  role: 'assistant' as const,
  content: [{ type: 'tool-call' as const, toolCallId: id, toolName: 'getAccessUserRoles', input: {} }],
});
const result = (id: string, value: string) => ({
  role: 'tool' as const,
  content: [
    {
      type: 'tool-result' as const,
      toolCallId: id,
      toolName: 'getAccessUserRoles',
      output: { type: 'text' as const, value },
    },
  ],
});
const reply = (text: string) => ({ role: 'assistant' as const, content: [{ type: 'text' as const, text }] });

type Prompt = Parameters<typeof trimEarlierToolResults>[0];

function outputsOf(prompt: Prompt): string[] {
  return prompt.flatMap((message) =>
    message.role === 'tool'
      ? message.content.flatMap((part) =>
          part.type === 'tool-result' && part.output.type === 'text' ? [part.output.value] : [],
        )
      : [],
  );
}

describe('trimEarlierToolResults', () => {
  it('replaces results from turns before the previous one and keeps the previous and current turns', () => {
    // Arrange
    const prompt = [
      system,
      user('What roles does jsmith have?'),
      call('1'),
      result('1', 'roles of jsmith'),
      reply('jsmith is a tenant admin.'),
      user('Which environments can I inspect?'),
      call('2'),
      result('2', 'environments'),
      user('What is a public client?'),
      call('3'),
      result('3', 'guide'),
    ] as Prompt;

    // Act
    const trimmed = trimEarlierToolResults(prompt);

    // Assert
    expect(outputsOf(trimmed)).toEqual([EARLIER_RESULT_NOTE, 'environments', 'guide']);
    expect(trimmed[2]).toBe(prompt[2]);
    expect(outputsOf(prompt)).toEqual(['roles of jsmith', 'environments', 'guide']);
  });

  it('leaves a conversation of two turns alone', () => {
    // Arrange
    const prompt = [
      system,
      user('Roles of jsmith?'),
      call('1'),
      result('1', 'roles'),
      user('Which come from tenant-admin?'),
    ] as Prompt;

    // Act
    const trimmed = trimEarlierToolResults(prompt);

    // Assert
    expect(trimmed).toBe(prompt);
  });
});

describe('createAccessHistoryProcessor', () => {
  it('rewrites only the request prompt', () => {
    // Arrange
    const processor = createAccessHistoryProcessor();
    const prompt = [system, user('a'), call('1'), result('1', 'old'), user('b'), user('c')] as Prompt;

    // Act
    const output = processor.processLLMRequest?.({ prompt } as never) as { prompt: Prompt };

    // Assert
    expect(processor.id).toBe('access-history');
    expect(outputsOf(output.prompt)).toEqual([EARLIER_RESULT_NOTE]);
  });
});
