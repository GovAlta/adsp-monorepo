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

  it('returns the prompt injection detector', () => {
    const requestContext = new RequestContext<Record<string, unknown>>();

    const processors = createInputProcessors({ logger, requestContext });

    expect(processors).toHaveLength(1);
    expect(processors[0]).toBeInstanceOf(PromptInjectionDetector);
  });
});
