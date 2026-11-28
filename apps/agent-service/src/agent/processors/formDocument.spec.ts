import type { ProcessLLMRequestArgs } from '@mastra/core/processors';
import { DOCUMENT_SECTION_TEXT_MARKER } from '../utils/documentOutline';
import { trimDocumentSectionText } from './formDocument';

type Prompt = ProcessLLMRequestArgs['prompt'];

const documentMessage = `Provided document 'survey.docx' is large. Its sections follow.

## Outline

- category-1: About your team (30018 characters)

${DOCUMENT_SECTION_TEXT_MARKER}

### category-1: About your team
Team name (required)`;

describe('trimDocumentSectionText', () => {
  it('sends the outline of a large document without its section text, in every user message', () => {
    // Arrange
    const prompt = [
      { role: 'system', content: 'You build forms.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Build this form.' },
          { type: 'text', text: documentMessage },
        ],
      },
      { role: 'assistant', content: [{ type: 'text', text: 'Built.' }] },
      { role: 'user', content: [{ type: 'text', text: 'Make team name optional.' }] },
    ] as Prompt;

    // Act
    const trimmed = trimDocumentSectionText(prompt);

    // Assert
    const parts = (trimmed[1].content as Array<{ text: string }>).map((part) => part.text);
    expect(parts[0]).toBe('Build this form.');
    expect(parts[1]).toContain('- category-1: About your team (30018 characters)');
    expect(parts[1]).not.toContain('Team name (required)');
    expect(trimmed[3]).toBe(prompt[3]);
  });

  it('leaves a prompt without document text as it is', () => {
    // Arrange
    const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Add an email field.' }] }] as Prompt;

    // Act
    const trimmed = trimDocumentSectionText(prompt);

    // Assert
    expect(trimmed).toBe(prompt);
  });
});
