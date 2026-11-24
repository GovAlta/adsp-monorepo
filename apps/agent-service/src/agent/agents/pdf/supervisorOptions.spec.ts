jest.mock('../../../environments/environment', () => ({
  environment: { MODEL_URL: 'https://models.test/v1', AGENT_PDF_MAX_OUTPUT_TOKENS: 10000 },
}));

import { PDF_GENERATION_AGENT_MAX_STEPS } from '../../model/executionLimits';
import {
  PDF_CLOSING_FILE_INSTRUCTIONS,
  PDF_CLOSING_INSTRUCTIONS,
  PDF_CORE_INSTRUCTIONS,
  PDF_FILE_INSTRUCTIONS,
} from './instructions';
import {
  createPdfSupervisorOptions,
  hasRecentFile,
  preparePdfStep,
  savedIn,
  savedWithReply,
} from './supervisorOptions';
import { PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL } from './types';

const logger = { warn: jest.fn(), debug: jest.fn() };
const definition = { id: 'permit', name: 'Permit notice', template: '<h1>{{data.title}}</h1>', variables: '{}' };

function requestContext(values: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries({ user: { name: 'Jane Smith' }, ...values }));
  return { get: (key: string) => store.get(key), set: (key: string, value: unknown) => store.set(key, value) };
}

const userMessage = (...parts: Array<{ type: string; text?: string }>) => ({ role: 'user', content: { parts } });
const saved = (text = '') => ({
  text,
  toolResults: [{ payload: { toolName: PDF_UPDATE_TOOL, result: { id: 'permit' } } }],
});

describe('preparePdfStep', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the core instructions and the saved template, with only the save tool', async () => {
    // Arrange
    const read = jest.fn().mockResolvedValue(definition);

    // Act
    const step = await preparePdfStep(
      { messages: [userMessage({ type: 'text', text: 'Change the title' })], requestContext: requestContext() },
      read,
    );

    // Assert
    expect(step.activeTools).toEqual([PDF_UPDATE_TOOL]);
    expect(step.systemMessages).toHaveLength(2);
    expect(step.systemMessages[0].content).toContain(PDF_CORE_INSTRUCTIONS);
    expect(step.systemMessages[0].content).not.toContain(PDF_FILE_INSTRUCTIONS);
    expect(step.systemMessages[0].content).toMatch(/Today is \d{4}-\d{2}-\d{2} \(\w+\)\. The user is Jane Smith\./);
    expect(step.systemMessages[1].content).toContain('Current PDF template "Permit notice" (saved):');
  });

  it('reads the template once per request', async () => {
    // Arrange
    const read = jest.fn().mockResolvedValue(definition);
    const context = requestContext();

    // Act
    await preparePdfStep({ requestContext: context }, read);
    await preparePdfStep({ requestContext: context, steps: [{ toolResults: [] }] }, read);

    // Assert
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('falls back to the retrieval tool when the template cannot be read', async () => {
    // Arrange
    const read = jest.fn().mockRejectedValue(new Error('configuration service unavailable'));

    // Act
    const step = await preparePdfStep({ requestContext: requestContext() }, read, logger as never);

    // Assert
    expect(step.activeTools).toEqual([PDF_RETRIEVAL_TOOL, PDF_UPDATE_TOOL]);
    expect(step.systemMessages).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('adds the file instructions while one of the latest user messages has a file', async () => {
    // Arrange
    const read = jest.fn().mockResolvedValue(definition);
    const messages = [
      userMessage({ type: 'text', text: 'Create a template from this' }, { type: 'file' }),
      { role: 'assistant', content: { parts: [{ type: 'text', text: 'Replace the current content?' }] } },
      userMessage({ type: 'text', text: 'yes' }),
    ];

    // Act
    const step = await preparePdfStep({ messages, requestContext: requestContext() }, read);

    // Assert
    expect(step.systemMessages[0].content).toContain(PDF_FILE_INSTRUCTIONS);
  });

  it('closes with a short reply call without the template or tools once the template is saved', async () => {
    // Arrange
    const read = jest.fn().mockResolvedValue(definition);

    // Act
    const step = await preparePdfStep({ requestContext: requestContext(), steps: [saved()] }, read);

    // Assert
    expect(step).toEqual({ activeTools: [], systemMessages: [{ role: 'system', content: PDF_CLOSING_INSTRUCTIONS }] });
    expect(read).not.toHaveBeenCalled();
  });

  it('asks the closing reply for what was and was not reproduced after building from a file', async () => {
    // Arrange
    const read = jest.fn().mockResolvedValue(definition);
    const messages = [userMessage({ type: 'text', text: 'Create a template from this' }, { type: 'file' })];

    // Act
    const step = await preparePdfStep({ messages, requestContext: requestContext(), steps: [saved()] }, read);

    // Assert
    expect(step.systemMessages[0].content).toBe(`${PDF_CLOSING_INSTRUCTIONS} ${PDF_CLOSING_FILE_INSTRUCTIONS}`);
  });
});

describe('hasRecentFile', () => {
  it('finds files in the latest two user messages only', () => {
    // Arrange
    const file = userMessage({
      type: 'text',
      text: "Provided file or image has filename 'a.png' and file service URN of: urn:x",
    });
    const text = (value: string) => userMessage({ type: 'text', text: value });

    // Act & Assert
    expect(hasRecentFile([file, text('yes')])).toBe(true);
    expect(hasRecentFile([file, text('yes'), text('make the title bigger')])).toBe(false);
    expect(hasRecentFile([])).toBe(false);
  });
});

describe('savedWithReply', () => {
  it('ends the turn after a save that came with a reply', () => {
    expect(savedWithReply({ steps: [saved('Saved. I changed the title.')] })).toBe(true);
  });

  it('continues after a save without a reply, a rejected save or a step without a save', () => {
    expect(savedWithReply({ steps: [saved()] })).toBe(false);
    expect(
      savedWithReply({ steps: [{ text: 'Fixing it.', toolResults: [{ toolName: PDF_UPDATE_TOOL, isError: true }] }] }),
    ).toBe(false);
    expect(savedWithReply({ steps: [{ text: 'Hi!', toolResults: [] }] })).toBe(false);
    expect(savedWithReply({ steps: [] })).toBe(false);
  });

  it('does not count a result that is an error', () => {
    expect(savedIn({ toolResults: [{ toolName: PDF_UPDATE_TOOL, result: new Error('NOT saved') }] })).toBe(false);
  });
});

describe('createPdfSupervisorOptions', () => {
  it('limits the steps, stops after a saved reply and prepares each step', async () => {
    // Arrange
    const read = jest.fn().mockResolvedValue(definition);

    // Act
    const options = createPdfSupervisorOptions(logger as never, read) as unknown as {
      maxSteps: number;
      modelSettings?: unknown;
      stopWhen: unknown;
      prepareStep: (args: unknown) => Promise<{ activeTools: string[] }>;
    };

    // Assert
    expect(options.maxSteps).toBe(PDF_GENERATION_AGENT_MAX_STEPS);
    expect(options.modelSettings).toBeUndefined();
    expect(options.stopWhen).toBe(savedWithReply);
    await expect(options.prepareStep({ requestContext: requestContext() })).resolves.toMatchObject({
      activeTools: [PDF_UPDATE_TOOL],
    });
  });
});
