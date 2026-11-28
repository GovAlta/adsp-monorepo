const mockEnvironment = {
  MODEL: 'gpt-5.1',
  MODEL_URL: 'https://models.test/openai/v1',
  MODEL_API_KEY: 'model-key',
  MODELS_WITHOUT_STREAMING: 'GOA-Default',
  MODELS_WITHOUT_IMAGES: '',
  MODELS_WITHOUT_TOOLS: '',
  MODEL_CONNECTION_RETRIES: 0,
  AGENT_ACCESS_MAX_OUTPUT_TOKENS: 1000,
  AGENT_FORM_GENERATION_MAX_OUTPUT_TOKENS: 4000,
  AGENT_FORM_GENERATION_REASONING_EFFORT: '',
  AGENT_NOTIFICATION_MAX_OUTPUT_TOKENS: 6000,
  AGENT_PDF_MAX_OUTPUT_TOKENS: 10000,
};

jest.mock('../../environments/environment', () => ({ environment: mockEnvironment }));

import type { LanguageModelV3 } from '@ai-sdk/provider';
import { getAgentModelConfiguration, getAgentProviderOptions } from './modelConfiguration';
import {
  ACCESS_SERVICE_AGENT_ID,
  FORM_GENERATION_AGENT_ID,
  NOTIFICATION_TEMPLATE_AGENT_ID,
  PDF_GENERATION_AGENT_ID,
} from './executionLimits';

const PROMPT = [
  { role: 'user' as const, content: [{ type: 'text' as const, text: 'Which clients are in the realm?' }] },
];

describe('getAgentModelConfiguration', () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    mockEnvironment.MODEL_URL = 'https://models.test/openai/v1';
    fetchMock
      .mockReset()
      .mockResolvedValue(new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }));
    globalThis.fetch = fetchMock;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  async function streamOnce(
    model: LanguageModelV3,
    providerOptions?: Parameters<LanguageModelV3['doStream']>[0]['providerOptions'],
  ) {
    await model.doStream({ prompt: PROMPT, providerOptions });
    const [url, request] = fetchMock.mock.calls[0];
    return { url, request, body: JSON.parse(request.body) };
  }

  it('asks the endpoint to report token usage on streamed replies', async () => {
    // Arrange
    const model = getAgentModelConfiguration() as LanguageModelV3;

    // Act
    const { body } = await streamOnce(model);

    // Assert
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  it('calls the configured endpoint with the configured model', async () => {
    // Arrange
    const model = getAgentModelConfiguration('gpt-5.1-mini') as LanguageModelV3;

    // Act
    const { url, body } = await streamOnce(model);

    // Assert
    expect(url).toBe('https://models.test/openai/v1/chat/completions');
    expect(body.model).toBe('gpt-5.1-mini');
  });

  it('sends the headers configured on the agent', async () => {
    // Arrange
    const model = getAgentModelConfiguration('gpt-5.1', {
      headers: { 'x-tenant-route': 'autotest' },
    }) as LanguageModelV3;

    // Act
    const { request } = await streamOnce(model);

    // Assert
    expect(request.headers).toMatchObject({ 'x-tenant-route': 'autotest', authorization: 'Bearer model-key' });
  });

  it('uses the model ID as is without an OpenAI-compatible endpoint', () => {
    // Arrange
    mockEnvironment.MODEL_URL = '';

    // Act
    const model = getAgentModelConfiguration('github-models/openai/gpt-4.1');

    // Assert
    expect(model).toBe('github-models/openai/gpt-4.1');
  });

  it('calls a model listed in MODELS_WITHOUT_STREAMING without streaming, even for a stream call', async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      Response.json({
        id: 'reply-1',
        model: 'GOA-Default',
        choices: [{ index: 0, message: { role: 'assistant', content: 'Hello.' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 12, completion_tokens: 2, total_tokens: 14 },
      }),
    );
    const model = getAgentModelConfiguration('GOA-Default') as LanguageModelV3;

    // Act
    const { stream } = await model.doStream({ prompt: PROMPT });
    const parts: { type: string }[] = [];
    for await (const part of stream as unknown as AsyncIterable<{ type: string }>) {
      parts.push(part);
    }

    // Assert
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.stream).toBeFalsy();
    expect(parts.map((part) => part.type)).toEqual([
      'stream-start',
      'response-metadata',
      'text-start',
      'text-delta',
      'text-end',
      'finish',
    ]);
  });

  it("sends the Access Service agent's reply limit as max_completion_tokens, which reasoning models accept", async () => {
    // Arrange
    const model = getAgentModelConfiguration() as LanguageModelV3;
    const providerOptions = getAgentProviderOptions(ACCESS_SERVICE_AGENT_ID) as never;

    // Act
    const { body } = await streamOnce(model, providerOptions);

    // Assert
    expect(body.max_completion_tokens).toBe(1000);
    expect(body).not.toHaveProperty('max_tokens');
  });
});

describe('getAgentProviderOptions', () => {
  beforeEach(() => {
    mockEnvironment.MODEL_URL = 'https://models.test/openai/v1';
  });

  it('limits Access Service agent replies through the OpenAI-compatible endpoint', () => {
    // Act
    const options = getAgentProviderOptions(ACCESS_SERVICE_AGENT_ID);

    // Assert
    expect(options).toEqual({ openai: { max_completion_tokens: 1000 } });
  });

  it('limits notification template agent replies, which can hold a whole email body', () => {
    // Act
    const options = getAgentProviderOptions(NOTIFICATION_TEMPLATE_AGENT_ID);

    // Assert
    expect(options).toEqual({ openai: { max_completion_tokens: 6000 } });
  });

  it('leaves the notification template reply limit to model settings without an OpenAI-compatible endpoint', () => {
    // Arrange
    mockEnvironment.MODEL_URL = '';

    // Act
    const options = getAgentProviderOptions(NOTIFICATION_TEMPLATE_AGENT_ID);

    // Assert
    expect(options).toBeUndefined();
  });

  it('limits PDF template agent replies, with room for a whole template field', () => {
    // Act
    const options = getAgentProviderOptions(PDF_GENERATION_AGENT_ID);

    // Assert
    expect(options).toEqual({ openai: { max_completion_tokens: 10000 } });
  });

  it('leaves the reply limit to model settings without an OpenAI-compatible endpoint', () => {
    // Arrange
    mockEnvironment.MODEL_URL = '';

    // Act
    const options = getAgentProviderOptions(ACCESS_SERVICE_AGENT_ID);

    // Assert
    expect(options).toBeUndefined();
  });

  it('limits form generation chat replies and keeps tool calls sequential', () => {
    // Act
    const options = getAgentProviderOptions(FORM_GENERATION_AGENT_ID);

    // Assert
    expect(options).toEqual({ openai: { max_completion_tokens: 4000, parallel_tool_calls: false } });
  });

  it('leaves form generation replies unlimited when its limit is 0', () => {
    // Arrange
    mockEnvironment.AGENT_FORM_GENERATION_MAX_OUTPUT_TOKENS = 0;

    // Act
    const options = getAgentProviderOptions(FORM_GENERATION_AGENT_ID);

    // Assert
    expect(options).toEqual({ openai: { parallel_tool_calls: false } });
    mockEnvironment.AGENT_FORM_GENERATION_MAX_OUTPUT_TOKENS = 4000;
  });

  it('adds nothing for other agents without a reasoning effort', () => {
    // Act
    const options = getAgentProviderOptions('builderAgent');

    // Assert
    expect(options).toBeUndefined();
  });
});
