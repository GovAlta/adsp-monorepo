import { createFormConfigurationTools } from './formConfiguration';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockTokenProvider = {
  getAccessToken: jest.fn().mockResolvedValue('test-token'),
};

const mockDirectory = {
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://config-service.test/')),
};

const mockRequestContext = {
  get: jest.fn((key: string) => {
    if (key === 'tenantId') return { toString: () => 'test-tenant-id' };
    if (key === 'formDefinitionId') return 'intake-form';
    return undefined;
  }),
};

describe('createFormConfigurationTools', () => {
  let tools: Awaited<ReturnType<typeof createFormConfigurationTools>>;

  beforeAll(async () => {
    tools = await createFormConfigurationTools({
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
      logger: mockLogger as never,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenProvider.getAccessToken.mockResolvedValue('test-token');
  });

  it('creates both form configuration tools', () => {
    expect(tools.formConfigurationRetrievalTool).toBeDefined();
    expect(tools.formConfigurationUpdateTool).toBeDefined();
  });

  describe('formConfigurationRetrievalTool', () => {
    it('retrieves the form configuration for the definition in request context', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          name: 'Intake Form',
          description: 'An intake form',
          dataSchema: { type: 'object', properties: { firstName: { type: 'string' } } },
          uiSchema: { type: 'VerticalLayout', elements: [] },
          anonymousApply: false,
          applicantRoles: [],
          assessorRoles: [],
        },
      });

      const result = await tools.formConfigurationRetrievalTool.execute({}, {
        requestContext: mockRequestContext,
      } as never);

      expect(result.name).toBe('Intake Form');
      const getUrl = mockedAxios.get.mock.calls[0][0] as string;
      expect(getUrl).toContain('form-service/intake-form/latest');
    });
  });

  describe('formConfigurationUpdateTool', () => {
    const successResponse = {
      status: 200,
      data: {
        latest: {
          configuration: {
            name: 'Intake Form',
            description: 'An intake form',
            dataSchema: { type: 'object', properties: { firstName: { type: 'string' } } },
            uiSchema: { type: 'VerticalLayout', elements: [] },
            anonymousApply: false,
            applicantRoles: [],
            assessorRoles: [],
          },
        },
      },
    };

    it('forwards dataSchema, uiSchema and anonymousApply in the update payload', async () => {
      mockedAxios.patch.mockResolvedValueOnce(successResponse);

      const dataSchema = { type: 'object', properties: { firstName: { type: 'string' } } };
      const uiSchema = { type: 'VerticalLayout', elements: [] };

      await tools.formConfigurationUpdateTool.execute(
        { dataSchema, uiSchema, anonymousApply: true },
        { requestContext: mockRequestContext } as never,
      );

      const patchBody = mockedAxios.patch.mock.calls[0][1] as { operation: string; update: Record<string, unknown> };
      expect(patchBody.operation).toBe('UPDATE');
      expect(patchBody.update).toEqual(
        expect.objectContaining({
          dataSchema,
          uiSchema,
          anonymousApply: true,
        }),
      );
    });

    it('sets the update id from the formDefinitionId in request context', async () => {
      mockedAxios.patch.mockResolvedValueOnce(successResponse);

      await tools.formConfigurationUpdateTool.execute(
        { dataSchema: { type: 'object' } },
        { requestContext: mockRequestContext } as never,
      );

      const patchBody = mockedAxios.patch.mock.calls[0][1] as { update: { id: string } };
      expect(patchBody.update.id).toBe('intake-form');
    });

    it('never forwards a name key in the update payload even when a caller passes one', async () => {
      mockedAxios.patch.mockResolvedValueOnce(successResponse);

      await tools.formConfigurationUpdateTool.execute(
        { name: 'Renamed Form', dataSchema: { type: 'object' } } as never,
        { requestContext: mockRequestContext } as never,
      );

      const patchBody = mockedAxios.patch.mock.calls[0][1] as { update: Record<string, unknown> };
      expect(patchBody.update).not.toHaveProperty('name');
    });

    it('patches the configuration URL for the definition in request context', async () => {
      mockedAxios.patch.mockResolvedValueOnce(successResponse);

      await tools.formConfigurationUpdateTool.execute(
        { dataSchema: { type: 'object' } },
        { requestContext: mockRequestContext } as never,
      );

      const patchUrl = mockedAxios.patch.mock.calls[0][0] as string;
      expect(patchUrl).toContain('form-service/intake-form');
    });

    it('returns the latest configuration from the response', async () => {
      mockedAxios.patch.mockResolvedValueOnce(successResponse);

      const result = await tools.formConfigurationUpdateTool.execute(
        { dataSchema: { type: 'object' } },
        { requestContext: mockRequestContext } as never,
      );

      expect(result.name).toBe('Intake Form');
    });
  });
});
