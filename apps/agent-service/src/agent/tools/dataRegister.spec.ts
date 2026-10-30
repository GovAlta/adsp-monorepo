import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { createDataRegisterTools, SESSION_EXPIRED_MESSAGE } from './dataRegister';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    __esModule: true,
    default: { ...actual.default, get: jest.fn(), post: jest.fn(), patch: jest.fn() },
    isAxiosError: actual.isAxiosError,
  };
});
const mockedGet = axios.get as jest.Mock;
const mockedPost = axios.post as jest.Mock;
const mockedPatch = axios.patch as jest.Mock;

const REGISTERS_URL = 'https://form-service.test/form/v1/registers';
const URN_PREFIX = 'urn:ads:platform:configuration:v2:/configuration/data-register/';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockDirectory = {
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://form-service.test/form/v1')),
};

const tenantId = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/test-tenant' };

const createUser = (exp: number = Math.floor(Date.now() / 1000) + 300) =>
  ({ id: 'user-1', name: 'Test User', token: { bearer: 'user-token', exp } }) as unknown as User;

const createContext = (user: User | null = createUser()) =>
  ({
    requestContext: {
      get: jest.fn((key: string) => {
        if (key === 'tenantId') return tenantId;
        if (key === 'user') return user;
        return undefined;
      }),
    },
  }) as never;

function axiosError(status: number, data: unknown = {}) {
  const error = new axios.AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST');
  error.response = { status, data, statusText: '', headers: {}, config: {} as never };
  return error;
}

const expectedRequestConfig = {
  params: { tenantId: tenantId.toString() },
  headers: { Authorization: 'Bearer user-token' },
};

const expectNoRequests = () => {
  expect(mockedGet).not.toHaveBeenCalled();
  expect(mockedPost).not.toHaveBeenCalled();
  expect(mockedPatch).not.toHaveBeenCalled();
};

describe('createDataRegisterTools', () => {
  let tools: Awaited<ReturnType<typeof createDataRegisterTools>>;

  beforeAll(async () => {
    tools = await createDataRegisterTools({
      directory: mockDirectory as never,
      logger: mockLogger as never,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates all data register tools', () => {
    expect(tools.dataRegisterListTool).toBeDefined();
    expect(tools.dataRegisterCreateTool).toBeDefined();
    expect(tools.dataRegisterGetTool).toBeDefined();
    expect(tools.dataRegisterUpdateTool).toBeDefined();
  });

  it('resolves the form-service v1 API', async () => {
    await createDataRegisterTools({ directory: mockDirectory as never, logger: mockLogger as never });

    expect(mockDirectory.getServiceUrl).toHaveBeenCalledTimes(1);
    expect(mockDirectory.getServiceUrl.mock.calls[0][0].toString()).toBe('urn:ads:platform:form-service:v1');
  });

  describe('dataRegisterListTool', () => {
    it('lists every register from form-service as the signed-in user', async () => {
      const registers = Array.from({ length: 12 }, (_, index) => ({
        namespace: 'data-register',
        name: `register-${index}`,
        description: `Register ${index}`,
        entries: ['a'],
      }));
      mockedGet.mockResolvedValueOnce({ data: registers });

      const result = await tools.dataRegisterListTool.execute({}, createContext());

      expect(mockedGet).toHaveBeenCalledWith(REGISTERS_URL, expectedRequestConfig);
      expect(result.registers).toHaveLength(12);
      expect(result.registers[11]).toEqual({
        name: 'register-11',
        description: 'Register 11',
        urn: `${URN_PREFIX}register-11`,
      });
    });

    it('keeps spaces in the URN unencoded and defaults a missing description', async () => {
      mockedGet.mockResolvedValueOnce({
        data: [{ namespace: 'data-register', name: 'event types', entries: ['Concert'] }],
      });

      const result = await tools.dataRegisterListTool.execute({}, createContext());

      expect(result.registers).toEqual([{ name: 'event types', description: '', urn: `${URN_PREFIX}event types` }]);
    });

    it('returns an empty list when the tenant has no registers', async () => {
      mockedGet.mockResolvedValueOnce({ data: [] });

      const result = await tools.dataRegisterListTool.execute({}, createContext());

      expect(result.registers).toEqual([]);
    });

    it("passes back form-service's error message", async () => {
      mockedGet.mockRejectedValueOnce(
        axiosError(403, { errorMessage: 'User Test User (ID: user-1) not permitted to find data registers.' }),
      );

      await expect(tools.dataRegisterListTool.execute({}, createContext())).rejects.toThrow(
        'Failed to list data registers: User Test User (ID: user-1) not permitted to find data registers.',
      );
    });
  });

  describe('dataRegisterCreateTool', () => {
    it('creates the register through form-service as the signed-in user', async () => {
      mockedPost.mockResolvedValueOnce({
        data: {
          namespace: 'data-register',
          name: 'weekdays',
          description: 'Days of the week',
          entries: ['Monday', 'Tuesday'],
        },
      });

      const result = await tools.dataRegisterCreateTool.execute(
        { name: 'weekdays', description: 'Days of the week', data: ['Monday', 'Tuesday'] },
        createContext(),
      );

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPost).toHaveBeenCalledWith(
        REGISTERS_URL,
        { name: 'weekdays', description: 'Days of the week', entries: ['Monday', 'Tuesday'] },
        expectedRequestConfig,
      );
      expect(mockedPatch).not.toHaveBeenCalled();
      expect(result).toEqual({
        name: 'weekdays',
        description: 'Days of the week',
        urn: `${URN_PREFIX}weekdays`,
        data: ['Monday', 'Tuesday'],
      });
    });

    it('creates a register with object values', async () => {
      const entries = [
        { label: 'Alberta', value: 'AB' },
        { label: 'British Columbia', value: 'BC' },
      ];
      mockedPost.mockResolvedValueOnce({
        data: { namespace: 'data-register', name: 'provinces', description: '', entries },
      });

      const result = await tools.dataRegisterCreateTool.execute({ name: 'provinces', data: entries }, createContext());

      expect(mockedPost.mock.calls[0][1]).toEqual({ name: 'provinces', description: undefined, entries });
      expect(result.data).toEqual(entries);
    });

    it.each(['event types', 'event_types', 'Event-Types-2', 'a'.repeat(50)])('accepts the name "%s"', async (name) => {
      mockedPost.mockResolvedValueOnce({ data: { namespace: 'data-register', name, description: '', entries: [] } });

      const result = await tools.dataRegisterCreateTool.execute({ name, data: [] }, createContext());

      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(result.urn).toBe(`${URN_PREFIX}${name}`);
    });

    it.each(['weekdays!', ' weekdays', 'weekdays ', '', 'a'.repeat(51), 'week/days'])(
      'rejects the name "%s" without calling form-service',
      async (name) => {
        await expect(tools.dataRegisterCreateTool.execute({ name, data: ['a'] }, createContext())).rejects.toThrow(
          `Invalid register name '${name}'.`,
        );
        expectNoRequests();
      },
    );

    it('tells the agent to update or rename when the name is already taken', async () => {
      mockedPost.mockRejectedValueOnce(axiosError(409, { errorMessage: "Data register 'weekdays' already exists." }));

      await expect(
        tools.dataRegisterCreateTool.execute({ name: 'weekdays', data: ['Monday'] }, createContext()),
      ).rejects.toThrow(
        "Data register 'weekdays' already exists. Nothing was changed. Use the update flow (get → confirm → update) or choose another name.",
      );
      expect(mockedPost).toHaveBeenCalledTimes(1);
      expect(mockedPatch).not.toHaveBeenCalled();
    });

    it("passes back form-service's error message", async () => {
      mockedPost.mockRejectedValueOnce(axiosError(400, { errorMessage: 'entries must be strings or objects' }));

      await expect(
        tools.dataRegisterCreateTool.execute({ name: 'weekdays', data: ['Monday'] }, createContext()),
      ).rejects.toThrow('Failed to create data register: entries must be strings or objects');
    });
  });

  describe('dataRegisterGetTool', () => {
    it('returns the register values form-service resolves', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { namespace: 'data-register', name: 'weekdays', description: '', entries: ['Monday', 'Tuesday'] },
      });

      const result = await tools.dataRegisterGetTool.execute({ name: 'weekdays' }, createContext());

      expect(mockedGet).toHaveBeenCalledWith(`${REGISTERS_URL}/weekdays`, expectedRequestConfig);
      expect(result).toEqual({ name: 'weekdays', data: ['Monday', 'Tuesday'] });
    });

    it('encodes the register name in the request path', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { namespace: 'data-register', name: 'event types', description: '', entries: ['Concert'] },
      });

      const result = await tools.dataRegisterGetTool.execute({ name: 'event types' }, createContext());

      expect(mockedGet).toHaveBeenCalledWith(`${REGISTERS_URL}/event%20types`, expectedRequestConfig);
      expect(result).toEqual({ name: 'event types', data: ['Concert'] });
    });

    it('reports a missing register as not existing', async () => {
      mockedGet.mockRejectedValueOnce(
        axiosError(404, { errorMessage: 'data register with ID nonexistent not found.' }),
      );

      await expect(tools.dataRegisterGetTool.execute({ name: 'nonexistent' }, createContext())).rejects.toThrow(
        "Data register 'nonexistent' does not exist.",
      );
    });

    it('rejects an invalid name without calling form-service', async () => {
      await expect(tools.dataRegisterGetTool.execute({ name: 'weekdays!' }, createContext())).rejects.toThrow(
        "Invalid register name 'weekdays!'.",
      );
      expectNoRequests();
    });
  });

  describe('dataRegisterUpdateTool', () => {
    it('replaces only the register values', async () => {
      mockedPatch.mockResolvedValueOnce({
        data: {
          namespace: 'data-register',
          name: 'weekdays',
          description: 'Days of the week',
          entries: ['Mon', 'Tue', 'Wed'],
        },
      });

      const result = await tools.dataRegisterUpdateTool.execute(
        { name: 'weekdays', data: ['Mon', 'Tue', 'Wed'] },
        createContext(),
      );

      expect(mockedPatch).toHaveBeenCalledTimes(1);
      expect(mockedPatch).toHaveBeenCalledWith(
        `${REGISTERS_URL}/weekdays`,
        { entries: ['Mon', 'Tue', 'Wed'] },
        expectedRequestConfig,
      );
      expect(result).toEqual({ name: 'weekdays', data: ['Mon', 'Tue', 'Wed'] });
    });

    it('encodes the register name in the request path', async () => {
      mockedPatch.mockResolvedValueOnce({
        data: { namespace: 'data-register', name: 'event types', description: '', entries: ['Concert'] },
      });

      await tools.dataRegisterUpdateTool.execute({ name: 'event types', data: ['Concert'] }, createContext());

      expect(mockedPatch.mock.calls[0][0]).toBe(`${REGISTERS_URL}/event%20types`);
    });

    it('reports a missing register as not existing and creates nothing', async () => {
      mockedPatch.mockRejectedValueOnce(
        axiosError(404, { errorMessage: 'data register with ID nonexistent not found.' }),
      );

      await expect(
        tools.dataRegisterUpdateTool.execute({ name: 'nonexistent', data: ['a'] }, createContext()),
      ).rejects.toThrow("Data register 'nonexistent' does not exist.");
      expect(mockedPost).not.toHaveBeenCalled();
    });

    it('rejects an invalid name without calling form-service', async () => {
      await expect(
        tools.dataRegisterUpdateTool.execute({ name: 'weekdays!', data: ['a'] }, createContext()),
      ).rejects.toThrow("Invalid register name 'weekdays!'.");
      expectNoRequests();
    });

    it("passes back form-service's error message", async () => {
      mockedPatch.mockRejectedValueOnce(axiosError(400, { errorMessage: 'entries must be an array' }));

      await expect(
        tools.dataRegisterUpdateTool.execute({ name: 'weekdays', data: ['a'] }, createContext()),
      ).rejects.toThrow('Failed to update data register: entries must be an array');
    });
  });

  describe('session expiry', () => {
    // Each tool with its input and the axios method it calls.
    const toolCalls = [
      ['dataRegisterListTool', {}, mockedGet],
      ['dataRegisterCreateTool', { name: 'weekdays', data: ['Monday'] }, mockedPost],
      ['dataRegisterGetTool', { name: 'weekdays' }, mockedGet],
      ['dataRegisterUpdateTool', { name: 'weekdays', data: ['Monday'] }, mockedPatch],
    ] as const;

    const execute = (toolName: (typeof toolCalls)[number][0], input: object, context: never) =>
      (tools[toolName].execute as unknown as (input: object, context: never) => Promise<unknown>)(input, context);

    it.each(toolCalls)('%s asks the user to reconnect when the token has expired', async (toolName, input) => {
      const expiredUser = createUser(Math.floor(Date.now() / 1000) - 1);

      await expect(execute(toolName, input, createContext(expiredUser))).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
      expectNoRequests();
    });

    it.each(toolCalls)('%s asks the user to reconnect when there is no signed-in user', async (toolName, input) => {
      await expect(execute(toolName, input, createContext(null))).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
      expectNoRequests();
    });

    it.each(toolCalls)(
      '%s asks the user to reconnect when form-service rejects the token',
      async (toolName, input, request) => {
        request.mockRejectedValueOnce(axiosError(401));

        await expect(execute(toolName, input, createContext())).rejects.toThrow(SESSION_EXPIRED_MESSAGE);
        expect(request).toHaveBeenCalledTimes(1);
      },
    );
  });
});
