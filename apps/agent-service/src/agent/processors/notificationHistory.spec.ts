import {
  createNotificationHistoryProcessor,
  EARLIER_ATTACHMENT_NOTE,
  EARLIER_LONG_TEXT_NOTE,
  EARLIER_PROPOSAL_NOTE,
  trimEarlierTemplateContent,
} from './notificationHistory';

const LONG_BODY = `<table width="600">${'<tr><td>Row</td></tr>'.repeat(40)}</table>`;

const system = { role: 'system' as const, content: 'rules' };
const user = (text: string) => ({ role: 'user' as const, content: [{ type: 'text' as const, text }] });
const userWithImage = (text: string) => ({
  role: 'user' as const,
  content: [
    { type: 'text' as const, text },
    { type: 'file' as const, data: 'data:image/png;base64,AAAA', mediaType: 'image/png' },
  ],
});
const proposal = (id: string, input: Record<string, string>, toolName = 'emailNotificationGenerateTool') => ({
  role: 'assistant' as const,
  content: [{ type: 'tool-call' as const, toolCallId: id, toolName, input }],
});
const result = (id: string) => ({
  role: 'tool' as const,
  content: [
    {
      type: 'tool-result' as const,
      toolCallId: id,
      toolName: 'emailNotificationGenerateTool',
      output: { type: 'text' as const, value: 'Saved and applied in the editor: body.' },
    },
  ],
});
const reply = (text: string) => ({ role: 'assistant' as const, content: [{ type: 'text' as const, text }] });

type Prompt = Parameters<typeof trimEarlierTemplateContent>[0];

function inputsOf(prompt: Prompt): unknown[] {
  return prompt.flatMap((message) =>
    message.role === 'assistant' && typeof message.content !== 'string'
      ? message.content.flatMap((part) => (part.type === 'tool-call' ? [part.input] : []))
      : [],
  );
}

describe('trimEarlierTemplateContent', () => {
  it('replaces bodies proposed in earlier turns and keeps the current turn and short fields', () => {
    // Arrange
    const prompt = [
      system,
      user('Add a details table.'),
      proposal('1', { subject: 'Form received', body: LONG_BODY }),
      result('1'),
      reply('I added a details table.'),
      user('Add a button.'),
      proposal('2', { body: LONG_BODY }),
      result('2'),
    ] as Prompt;

    // Act
    const trimmed = trimEarlierTemplateContent(prompt);

    // Assert
    expect(inputsOf(trimmed)).toEqual([{ subject: 'Form received', body: EARLIER_PROPOSAL_NOTE }, { body: LONG_BODY }]);
    expect(inputsOf(prompt)).toEqual([{ subject: 'Form received', body: LONG_BODY }, { body: LONG_BODY }]);
  });

  it('leaves calls to other tools alone', () => {
    // Arrange
    const prompt = [
      system,
      user('Read this file.'),
      proposal('1', { body: LONG_BODY }, 'fileDownloadTool'),
      user('Thanks'),
    ] as Prompt;

    // Act
    const trimmed = trimEarlierTemplateContent(prompt);

    // Assert
    expect(inputsOf(trimmed)).toEqual([{ body: LONG_BODY }]);
  });

  it('keeps attachments and pasted content for one more turn, then replaces them', () => {
    // Arrange
    const pasted = 'x'.repeat(2500);
    const prompt = [
      system,
      userWithImage('Match this mock-up.'),
      reply('Done.'),
      user(pasted),
      reply('Done.'),
      userWithImage('And this one?'),
      reply('Done.'),
      user('Shorter, please.'),
    ] as Prompt;

    // Act
    const trimmed = trimEarlierTemplateContent(prompt);

    // Assert
    expect(trimmed[1].content).toEqual([
      { type: 'text', text: 'Match this mock-up.' },
      { type: 'text', text: EARLIER_ATTACHMENT_NOTE },
    ]);
    expect(trimmed[3].content).toEqual([{ type: 'text', text: EARLIER_LONG_TEXT_NOTE }]);
    expect(trimmed[5]).toBe(prompt[5]);
    expect(trimmed[7]).toBe(prompt[7]);
  });

  it('leaves the first turn alone', () => {
    // Arrange
    const prompt = [system, userWithImage('Match this mock-up.'), proposal('1', { body: LONG_BODY })] as Prompt;

    // Act
    const trimmed = trimEarlierTemplateContent(prompt);

    // Assert
    expect(trimmed).toEqual(prompt);
  });
});

describe('createNotificationHistoryProcessor', () => {
  it('trims the request to the model', async () => {
    // Arrange
    const processor = createNotificationHistoryProcessor();
    const prompt = [system, user('Add a table.'), proposal('1', { body: LONG_BODY }), user('Add a button.')] as Prompt;

    // Act
    const output = await processor.processLLMRequest?.({ prompt } as never);

    // Assert
    expect(inputsOf((output as { prompt: Prompt }).prompt)).toEqual([{ body: EARLIER_PROPOSAL_NOTE }]);
  });
});
