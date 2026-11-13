jest.mock('../../../../../environments/environment', () => ({
  environment: { MODEL_URL: 'https://models.test/openai/v1', AGENT_FORM_GENERATION_MAX_OUTPUT_TOKENS: 4000 },
}));
jest.mock('../../schema/definitionClient', () => ({ getLatestFormDefinition: jest.fn() }));

import { adspId, type ServiceDirectory, type TokenProvider } from '@abgov/adsp-service-sdk';
import { RequestContext } from '@mastra/core/request-context';
import type { Logger } from 'winston';
import { SOURCE_DOCUMENTS_KEY } from '../../../../types';
import { getLatestFormDefinition } from '../../schema/definitionClient';
import { createCurrentFormReader, prepareFormGenerationStep } from './stepOptions';

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
const directory = {
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://configuration.test/configuration/')),
} as unknown as ServiceDirectory;
const tokenProvider = { getAccessToken: jest.fn().mockResolvedValue('token') } as unknown as TokenProvider;
const userMessage = (text: string) => ({ role: 'user', content: { parts: [{ type: 'text', text }] } });

function contextWith(values: Record<string, unknown>) {
  const requestContext = new RequestContext<Record<string, unknown>>();
  for (const [key, value] of Object.entries(values)) {
    requestContext.set(key, value);
  }
  return requestContext;
}

describe('prepareFormGenerationStep', () => {
  const readCurrentForm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    readCurrentForm.mockResolvedValue('- email "Email": string — ui /elements/0');
  });

  it('describes the current form in the instructions of a form question', async () => {
    // Act
    const { systemMessages } = await prepareFormGenerationStep(
      { messages: [userMessage('Make the email field required.')], requestContext: contextWith({}) },
      readCurrentForm,
    );

    // Assert
    expect(systemMessages[0].content).toContain('## Current form\n- email "Email": string — ui /elements/0');
  });

  it('neither reads the form nor offers more than the index tool for a greeting', async () => {
    // Act
    const { activeTools } = await prepareFormGenerationStep(
      { messages: [userMessage('thanks')], requestContext: contextWith({}) },
      readCurrentForm,
    );

    // Assert
    expect(activeTools).toEqual(['formSchemaIndex']);
    expect(readCurrentForm).not.toHaveBeenCalled();
  });

  it('offers the document tools when the message brought a document', async () => {
    // Arrange
    const requestContext = contextWith({ [SOURCE_DOCUMENTS_KEY]: [{ filename: 'form.pdf' }] });

    // Act
    const { activeTools } = await prepareFormGenerationStep(
      { messages: [userMessage('Build this form.')], requestContext },
      readCurrentForm,
    );

    // Assert
    expect(activeTools).toEqual(expect.arrayContaining(['documentExtractTool', 'fileDownloadTool']));
  });
});

describe('createCurrentFormReader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the request form definition in the tenant and describes it', async () => {
    // Arrange
    (getLatestFormDefinition as jest.Mock).mockResolvedValue({
      dataSchema: { type: 'object', properties: { email: { type: 'string' } } },
      uiSchema: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/email', label: 'Email' }],
      },
    });
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const readCurrentForm = createCurrentFormReader({ logger, directory, tokenProvider });

    // Act
    const currentForm = await readCurrentForm(contextWith({ formDefinitionId: 'grant-form', tenantId }));

    // Assert
    expect(getLatestFormDefinition).toHaveBeenCalledWith(expect.anything(), tenantId.toString(), 'grant-form');
    expect(currentForm).toContain('- email "Email": string — ui /elements/0');
  });

  it('returns nothing without a form definition in the request', async () => {
    // Arrange
    const readCurrentForm = createCurrentFormReader({ logger, directory, tokenProvider });

    // Act
    const currentForm = await readCurrentForm(contextWith({}));

    // Assert
    expect(currentForm).toBeUndefined();
  });

  it('tells the model to use formSchemaIndex when the form cannot be read', async () => {
    // Arrange
    (getLatestFormDefinition as jest.Mock).mockRejectedValue(new Error('Request failed with status code 503'));
    const readCurrentForm = createCurrentFormReader({ logger, directory, tokenProvider });

    // Act
    const currentForm = await readCurrentForm(contextWith({ formDefinitionId: 'grant-form' }));

    // Assert
    expect(currentForm).toBe('The current form could not be loaded. Call formSchemaIndex to read it.');
    expect(logger.warn).toHaveBeenCalled();
  });
});
