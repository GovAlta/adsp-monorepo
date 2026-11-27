import { PromptInjectionDetector } from '@mastra/core/processors';
import { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { createInputProcessors } from './index';

jest.mock('@mastra/core/processors', () => ({
  PromptInjectionDetector: jest.fn(),
}));
jest.mock('./file', () => ({
  FileServiceDownloadProcessor: jest.fn(),
}));

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

describe('createInputProcessors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks only the new message for prompt injection', () => {
    const requestContext = new RequestContext<Record<string, unknown>>();

    createInputProcessors({ logger, requestContext });

    expect(PromptInjectionDetector).toHaveBeenCalledWith(
      expect.objectContaining({ lastMessageOnly: true, strategy: 'block', threshold: 0.8 }),
    );
  });

  it('describes the detection schema in the prompt, since some models stall on a strict JSON schema', () => {
    const requestContext = new RequestContext<Record<string, unknown>>();

    createInputProcessors({ logger, requestContext });

    expect(PromptInjectionDetector).toHaveBeenCalledWith(
      expect.objectContaining({ structuredOutputOptions: { jsonPromptInjection: true } }),
    );
  });

  it('returns the prompt injection detector', () => {
    const requestContext = new RequestContext<Record<string, unknown>>();

    const processors = createInputProcessors({ logger, requestContext });

    expect(processors).toHaveLength(1);
    expect(processors[0]).toBeInstanceOf(PromptInjectionDetector);
  });

  it('trims earlier tool results and large document text for the form generation agent before the injection check', () => {
    // Arrange
    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set('agentId', 'formGenerationAgent');

    // Act
    const processors = createInputProcessors({ logger, requestContext });

    // Assert
    expect(processors.map((processor) => processor.id)).toEqual([
      'form-generation-history',
      'form-document-outline',
      undefined,
    ]);
    expect(processors[2]).toBeInstanceOf(PromptInjectionDetector);
  });

  it('shortens earlier template proposals for the notification template agent', () => {
    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set('agentId', 'notificationEmailTemplateAgent');

    const processors = createInputProcessors({ logger, requestContext });

    expect(processors.map((processor) => processor.id)).toEqual(['notification-template-history', undefined]);
    expect(processors[1]).toBeInstanceOf(PromptInjectionDetector);
  });

  it('trims the PDF template agent history before the prompt injection check', () => {
    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set('agentId', 'pdfGenerationAgent');

    const processors = createInputProcessors({ logger, requestContext });

    expect(processors.map((processor) => processor.id)).toEqual(['pdf-history', undefined]);
    expect(processors[1]).toBeInstanceOf(PromptInjectionDetector);
  });
});
