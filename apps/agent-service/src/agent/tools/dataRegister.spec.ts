import { createDataRegisterTools } from './dataRegister';
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
    return undefined;
  }),
};

describe('createDataRegisterTools', () => {
  let tools: Awaited<ReturnType<typeof createDataRegisterTools>>;

  beforeAll(async () => {
    tools = await createDataRegisterTools({
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
      logger: mockLogger as never,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenProvider.getAccessToken.mockResolvedValue('test-token');
  });

  it('creates all three data register tools', () => {
    expect(tools.dataRegisterListTool).toBeDefined();
    expect(tools.dataRegisterCreateTool).toBeDefined();
    expect(tools.dataRegisterUpdateTool).toBeDefined();
  });

  describe('dataRegisterListTool', () => {
    it('lists registers filtered by data-register namespace', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          configuration: {
            'data-register:weekdays': {
              configurationSchema: { type: 'array' },
              description: 'Days of the week',
            },
            'data-register:provinces': {
              configurationSchema: { type: 'array' },
              description: 'Canadian provinces',
            },
            'form-service:my-form': {
              configurationSchema: { type: 'object' },
              description: 'A form definition',
            },
          },
        },
      });

      const result = await tools.dataRegisterListTool.execute({}, { requestContext: mockRequestContext } as never);

      expect(result.registers).toHaveLength(2);
      expect(result.registers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'weekdays', description: 'Days of the week' }),
          expect.objectContaining({ name: 'provinces', description: 'Canadian provinces' }),
        ]),
      );
      expect(result.registers[0].urn).toContain('data-register/');
    });

    it('returns empty array when no registers exist', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { configuration: {} },
      });

      const result = await tools.dataRegisterListTool.execute({}, { requestContext: mockRequestContext } as never);

      expect(result.registers).toHaveLength(0);
    });

    it('throws on 403 permission denied', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403, statusText: 'Forbidden', data: {} },
        message: 'Request failed with status code 403',
      });

      // axios.isAxiosError check
      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(
        tools.dataRegisterListTool.execute({}, { requestContext: mockRequestContext } as never),
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('dataRegisterCreateTool', () => {
    it('creates definition and sets initial data', async () => {
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } }); // definition
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } }); // data

      const result = await tools.dataRegisterCreateTool.execute(
        {
          name: 'weekdays',
          description: 'Days of the week',
          data: ['Monday', 'Tuesday', 'Wednesday'],
        },
        { requestContext: mockRequestContext } as never,
      );

      expect(mockedAxios.patch).toHaveBeenCalledTimes(2);

      // First call: create definition
      const firstCall = mockedAxios.patch.mock.calls[0];
      expect(firstCall[0]).toContain('platform/configuration-service');
      expect(firstCall[1]).toEqual(
        expect.objectContaining({
          operation: 'UPDATE',
          update: expect.objectContaining({
            'data-register:weekdays': expect.objectContaining({
              configurationSchema: expect.objectContaining({ type: 'array' }),
            }),
          }),
        }),
      );

      // Second call: set data
      const secondCall = mockedAxios.patch.mock.calls[1];
      expect(secondCall[0]).toContain('data-register/weekdays');
      expect(secondCall[1]).toEqual(
        expect.objectContaining({
          operation: 'REPLACE',
          configuration: ['Monday', 'Tuesday', 'Wednesday'],
        }),
      );

      expect(result.name).toBe('weekdays');
      expect(result.urn).toContain('data-register/weekdays');
      expect(result.data).toEqual(['Monday', 'Tuesday', 'Wednesday']);
    });

    it('creates register with object array data', async () => {
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } });
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } });

      const objectData = [
        { label: 'Alberta', value: 'AB' },
        { label: 'British Columbia', value: 'BC' },
      ];

      const result = await tools.dataRegisterCreateTool.execute({ name: 'provinces', data: objectData }, {
        requestContext: mockRequestContext,
      } as never);

      expect(result.data).toEqual(objectData);

      // Verify schema uses items.type: 'object' for object data
      const defCall = mockedAxios.patch.mock.calls[0];
      const defBody = defCall[1] as Record<string, Record<string, Record<string, unknown>>>;
      expect(defBody.update['data-register:provinces'].configurationSchema).toEqual({
        type: 'array',
        items: { type: 'object' },
      });
    });

    it('uses items.type string for string array data', async () => {
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } });
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } });

      await tools.dataRegisterCreateTool.execute({ name: 'colors', data: ['Red', 'Blue', 'Green'] }, {
        requestContext: mockRequestContext,
      } as never);

      const defCall = mockedAxios.patch.mock.calls[0];
      const defBody = defCall[1] as Record<string, Record<string, Record<string, unknown>>>;
      expect(defBody.update['data-register:colors'].configurationSchema).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('throws on 403 permission denied', async () => {
      mockedAxios.patch.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403, statusText: 'Forbidden', data: {} },
        message: 'Request failed with status code 403',
      });

      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(
        tools.dataRegisterCreateTool.execute({ name: 'test', data: ['a'] }, {
          requestContext: mockRequestContext,
        } as never),
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('dataRegisterUpdateTool', () => {
    it('replaces register data', async () => {
      mockedAxios.patch.mockResolvedValueOnce({ data: { latest: {} } });

      const result = await tools.dataRegisterUpdateTool.execute(
        { name: 'weekdays', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        { requestContext: mockRequestContext } as never,
      );

      expect(mockedAxios.patch).toHaveBeenCalledTimes(1);
      const call = mockedAxios.patch.mock.calls[0];
      expect(call[0]).toContain('data-register/weekdays');
      expect(call[1]).toEqual(
        expect.objectContaining({
          operation: 'REPLACE',
          configuration: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        }),
      );

      expect(result.name).toBe('weekdays');
      expect(result.data).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    });

    it('throws on 404 not found', async () => {
      mockedAxios.patch.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404, statusText: 'Not Found', data: {} },
        message: 'Request failed with status code 404',
      });

      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(
        tools.dataRegisterUpdateTool.execute({ name: 'nonexistent', data: ['a'] }, {
          requestContext: mockRequestContext,
        } as never),
      ).rejects.toThrow('not found');
    });

    it('throws on 400 validation error', async () => {
      mockedAxios.patch.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, statusText: 'Bad Request', data: { message: 'Invalid data format' } },
        message: 'Request failed with status code 400',
      });

      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(
        tools.dataRegisterUpdateTool.execute({ name: 'weekdays', data: ['a'] }, {
          requestContext: mockRequestContext,
        } as never),
      ).rejects.toThrow('Validation failed');
    });
  });
});
