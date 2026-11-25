import {
  buildFormGenerationInstructions,
  FORM_GENERATION_BASE_TOOL_IDS,
  getFormGenerationActiveTools,
  getPreviousUserText,
  selectFormGenerationTopics,
} from './routing';

const userMessage = (text: string) => ({ role: 'user', content: { parts: [{ type: 'text', text }] } });
const agentMessage = (text: string) => ({ role: 'assistant', content: { parts: [{ type: 'text', text }] } });

describe('selectFormGenerationTopics', () => {
  it('treats a greeting as small talk with no topics', () => {
    // Act
    const selection = selectFormGenerationTopics({ text: 'hi' });

    // Assert
    expect(selection).toEqual({ greeting: true, topics: [] });
  });

  it('does not treat a confirmation as small talk, because it may approve a change', () => {
    // Act
    const selection = selectFormGenerationTopics({ text: 'ok' });

    // Assert
    expect(selection.greeting).toBe(false);
  });

  it.each([
    ['Add an Alberta mailing address.', 'components'],
    ['Which data registers do we have?', 'registers'],
    ['Show "Spouse name" only when marital status is Married.', 'rules'],
    ['Add a total that sums the three expense amounts.', 'computed'],
    ['Build the form from the attached PDF.', 'documents'],
    ['Split this into two pages.', 'layout'],
  ])('selects the topic of "%s"', (text, topic) => {
    // Act
    const { topics } = selectFormGenerationTopics({ text });

    // Assert
    expect(topics).toContain(topic);
  });

  it('keeps an unrelated question to the core', () => {
    // Act
    const { topics } = selectFormGenerationTopics({ text: "What's the weather in Edmonton tomorrow?" });

    // Assert
    expect(topics).toEqual([]);
  });

  it('continues the topic of the previous question for a short follow-up', () => {
    // Act
    const { topics } = selectFormGenerationTopics({
      text: 'Make it optional.',
      previousText: 'Add a mailing address field.',
    });

    // Assert
    expect(topics).toEqual(['components']);
  });

  it('keeps name, email and phone fields to the core, which lists the common definitions', () => {
    // Act
    const { topics } = selectFormGenerationTopics({ text: 'Make the email field required.' });

    // Assert
    expect(topics).toEqual([]);
  });

  it('continues the topic of the tools used recently', () => {
    // Act
    const { topics } = selectFormGenerationTopics({ text: 'Yes, go ahead.', recentToolNames: ['dataRegisterGetTool'] });

    // Assert
    expect(topics).toEqual(['registers']);
  });

  it('adds the documents topic when a document is attached, even to a greeting', () => {
    // Act
    const selection = selectFormGenerationTopics({ text: 'hi', hasDocuments: true });

    // Assert
    expect(selection).toEqual({ greeting: false, topics: ['documents'] });
  });
});

describe('getFormGenerationActiveTools', () => {
  it('gives a greeting only the index tool, because the endpoint needs a tool when tool calls are sequential', () => {
    // Act
    const tools = getFormGenerationActiveTools({ greeting: true, topics: [] });

    // Assert
    expect(tools).toEqual(['formSchemaIndex']);
  });

  it('gives a question the base tools and the tools of its topics', () => {
    // Act
    const tools = getFormGenerationActiveTools({ greeting: false, topics: ['registers'] });

    // Assert
    expect(tools).toEqual([
      ...FORM_GENERATION_BASE_TOOL_IDS,
      'dataRegisterListTool',
      'dataRegisterGetTool',
      'dataRegisterCreateTool',
      'dataRegisterUpdateTool',
    ]);
  });
});

describe('buildFormGenerationInstructions', () => {
  const context = { date: '2026-11-12', userName: 'Jane Doe', currentForm: '- email "Email": string — ui /elements/0' };

  it('includes only the sections of the selected topics', () => {
    // Act
    const instructions = buildFormGenerationInstructions({ greeting: false, topics: ['computed'] }, context);

    // Assert
    expect(instructions).toContain('## Computed Fields');
    expect(instructions).not.toContain('## Data Registers');
    expect(instructions).not.toContain('## JSON Forms Rules Reference');
  });

  it('lists the inputs of the active tools only', () => {
    // Act
    const instructions = buildFormGenerationInstructions({ greeting: false, topics: [] }, context);

    // Assert
    expect(instructions).toContain('formSchemaPatch:');
    expect(instructions).not.toContain('dataRegisterCreateTool:');
  });

  it('describes the current form after the static sections, then the request context', () => {
    // Act
    const instructions = buildFormGenerationInstructions({ greeting: false, topics: [] }, context);

    // Assert
    expect(instructions.indexOf('## Final execution guard')).toBeLessThan(instructions.indexOf('## Current form'));
    expect(instructions.endsWith('Request context:\nCurrent date: 2026-11-12\nUser: Jane Doe')).toBe(true);
  });

  it('tells the model to answer a greeting without tools or the current form', () => {
    // Act
    const instructions = buildFormGenerationInstructions({ greeting: true, topics: [] }, { date: '2026-11-12' });

    // Assert
    expect(instructions).toContain('This message is a greeting or thanks');
    expect(instructions).not.toContain('## Tool required inputs');
    expect(instructions).not.toContain('## Current form');
  });
});

describe('getPreviousUserText', () => {
  it('returns the user message before the latest one', () => {
    // Arrange
    const messages = [
      userMessage('Add a phone number field.'),
      agentMessage('Which kind?'),
      userMessage('Make it optional.'),
    ];

    // Act
    const text = getPreviousUserText(messages);

    // Assert
    expect(text).toBe('Add a phone number field.');
  });

  it('returns empty text for the first message of a chat', () => {
    // Act
    const text = getPreviousUserText([userMessage('hi')]);

    // Assert
    expect(text).toBe('');
  });
});
