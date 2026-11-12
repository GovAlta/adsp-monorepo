const mockEnvironment = {
  MODEL: 'gpt-5.1',
  MODEL_URL: 'https://models.test/openai/v1',
  MODEL_API_KEY: 'model-key',
  AGENT_ACCESS_MAX_OUTPUT_TOKENS: 1000,
};

jest.mock('../../environments/environment', () => ({ environment: mockEnvironment }));

import type { LanguageModelV3 } from '@ai-sdk/provider';
import { getAgentModelConfiguration, getAgentProviderOptions } from './modelConfiguration';
import { ACCESS_SERVICE_AGENT_ID } from './executionLimits';

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

  it('leaves the reply limit to model settings without an OpenAI-compatible endpoint', () => {
    // Arrange
    mockEnvironment.MODEL_URL = '';

    // Act
    const options = getAgentProviderOptions(ACCESS_SERVICE_AGENT_ID);

    // Assert
    expect(options).toBeUndefined();
  });

  it('adds nothing for other agents without a reasoning effort', () => {
    // Act
    const options = getAgentProviderOptions('builderAgent');

    // Assert
    expect(options).toBeUndefined();
  });
});
