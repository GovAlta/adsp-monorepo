import {
  createPdfHistoryProcessor,
  EARLIER_FILE_NOTE,
  EARLIER_SAVE_NOTE,
  EARLIER_TEMPLATE_NOTE,
  FIELDS_LEFT_OUT_NOTE,
  SAVED_NOTE,
  trimPdfHistory,
} from './pdfHistory';

const UPDATE = 'pdfConfigurationUpdateTool';
const RETRIEVE = 'pdfConfigurationRetrievalTool';
const bigTemplate = '<h1>{{data.title}}</h1>'.repeat(200);

const system = { role: 'system' as const, content: 'rules' };
const user = (text: string) => ({ role: 'user' as const, content: [{ type: 'text' as const, text }] });
const call = (id: string, toolName: string, input: Record<string, unknown> = {}) => ({
  role: 'assistant' as const,
  content: [{ type: 'tool-call' as const, toolCallId: id, toolName, input }],
});
const result = (id: string, toolName: string, value: string, type = 'text') => ({
  role: 'tool' as const,
  content: [{ type: 'tool-result' as const, toolCallId: id, toolName, output: { type, value } }],
});
const reply = (text: string) => ({ role: 'assistant' as const, content: [{ type: 'text' as const, text }] });

type Prompt = Parameters<typeof trimPdfHistory>[0];

const outputs = (prompt: Prompt) =>
  prompt.flatMap((message) =>
    message.role === 'tool' ? message.content.map((part) => (part as { output: { value: string } }).output.value) : [],
  );
const inputs = (prompt: Prompt) =>
  prompt.flatMap((message) =>
    message.role === 'assistant'
      ? message.content.flatMap((part) => (part.type === 'tool-call' ? [(part as { input: unknown }).input] : []))
      : [],
  );

describe('trimPdfHistory', () => {
  it('replaces template copies in earlier turns and a successful save in this turn with short notes', () => {
    // Arrange
    const prompt = [
      system,
      user('Add a notes section'),
      call('1', RETRIEVE),
      result('1', RETRIEVE, bigTemplate),
      call('2', UPDATE, { template: bigTemplate, variables: '{}' }),
      result('2', UPDATE, bigTemplate),
      reply('Saved.'),
      user('Make its font smaller'),
      call('3', UPDATE, { additionalStyles: '.notes { font-size: 8pt; }' }),
      result('3', UPDATE, 'Saved. The editor now shows the updated template.'),
    ] as Prompt;

    // Act
    const trimmed = trimPdfHistory(prompt);

    // Assert
    expect(outputs(trimmed)).toEqual([EARLIER_TEMPLATE_NOTE, EARLIER_SAVE_NOTE, SAVED_NOTE]);
    expect(inputs(trimmed)).toEqual([
      {},
      { savedFields: ['template', 'variables'], note: FIELDS_LEFT_OUT_NOTE },
      { savedFields: ['additionalStyles'], note: FIELDS_LEFT_OUT_NOTE },
    ]);
    expect(outputs(prompt)).toContain(bigTemplate);
  });

  it('keeps a rejected save of this turn, so the retry can send every field again', () => {
    // Arrange
    const rejected = 'Configuration was NOT saved. template: Parse error';
    const prompt = [
      system,
      user('Fix the row numbers'),
      call('1', UPDATE, { template: bigTemplate }),
      result('1', UPDATE, rejected, 'error-text'),
    ] as Prompt;

    // Act
    const trimmed = trimPdfHistory(prompt);

    // Assert
    expect(trimmed).toBe(prompt);
  });

  it('keeps a retrieval in this turn, which is how the agent reads the template when it is not in its prompt', () => {
    // Arrange
    const prompt = [system, user('hi'), call('1', RETRIEVE), result('1', RETRIEVE, bigTemplate)] as Prompt;

    // Act & Assert
    expect(trimPdfHistory(prompt)).toBe(prompt);
  });

  it('leaves out files and extracted documents from turns before the previous one', () => {
    // Arrange
    const upload = {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: 'Create a template from this' },
        { type: 'file' as const, data: 'data:image/png;base64,AAAA', mediaType: 'image/png' },
        { type: 'text' as const, text: 'extracted document '.repeat(400) },
      ],
    };
    const prompt = [
      system,
      upload,
      reply('Replace the current content?'),
      user('yes'),
      reply('Saved.'),
      user('thanks'),
    ] as Prompt;

    // Act
    const trimmed = trimPdfHistory(prompt);

    // Assert
    expect(trimmed[1].content).toEqual([
      { type: 'text', text: 'Create a template from this' },
      { type: 'text', text: EARLIER_FILE_NOTE },
      { type: 'text', text: EARLIER_FILE_NOTE },
    ]);
    expect(trimPdfHistory(prompt.slice(0, 4) as Prompt)).toEqual(prompt.slice(0, 4));
  });
});

describe('createPdfHistoryProcessor', () => {
  it('rewrites only the request prompt', () => {
    // Arrange
    const processor = createPdfHistoryProcessor();
    const prompt = [system, user('a'), call('1', RETRIEVE), result('1', RETRIEVE, bigTemplate), user('b')] as Prompt;

    // Act
    const output = processor.processLLMRequest?.({ prompt } as never) as { prompt: Prompt };

    // Assert
    expect(processor.id).toBe('pdf-history');
    expect(outputs(output.prompt)).toEqual([EARLIER_TEMPLATE_NOTE]);
  });
});
