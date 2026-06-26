import { createSchemaPatchTools } from './schemaPatch';
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
    if (key === 'tenantId') return { toString: () => 'test-tenant' };
    if (key === 'formDefinitionId') return 'intake-form';
    return undefined;
  }),
};

// ---- Shared fixtures -------------------------------------------------------

const currentSchema = {
  dataSchema: {
    type: 'object',
    required: ['firstName'],
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      age: { type: 'integer' },
    },
  },
  uiSchema: {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Personal',
        elements: [
          { type: 'Control', scope: '#/properties/firstName' },
          { type: 'Control', scope: '#/properties/lastName' },
        ],
      },
    ],
  },
};

function makeAxiosError(status: number, message: string): Error {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  });
}

const ctx = { requestContext: mockRequestContext } as never;

// ---- Tests -----------------------------------------------------------------

describe('createSchemaPatchTools', () => {
  let tools: Awaited<ReturnType<typeof createSchemaPatchTools>>;

  beforeAll(async () => {
    tools = await createSchemaPatchTools({
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
      logger: mockLogger as never,
    });
  });

  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    // Restore isAxiosError after clearAllMocks() — it starts as jest.fn() returning undefined
    (axios.isAxiosError as unknown as jest.Mock).mockImplementation(
      (err) => (err as { isAxiosError?: boolean })?.isAxiosError === true,
    );
  });

  it('creates the formSchemaPatch tool', () => {
    expect(tools.formSchemaPatch).toBeDefined();
  });

  it('fetches the current schema for the definition in request context before patching', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });

    await tools.formSchemaPatch.execute(
      { dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }] },
      ctx,
    );

    const url = mockedAxios.get.mock.calls[0][0] as string;
    expect(url).toContain('form-service/intake-form/latest');
  });

  it('applies dataSchemaOps and sends the patched dataSchema via UPDATE', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });

    await tools.formSchemaPatch.execute(
      { dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }] },
      ctx,
    );

    const body = mockedAxios.patch.mock.calls[0][1] as { operation: string; update: Record<string, unknown> };
    expect(body.operation).toBe('UPDATE');
    const sentDataSchema = body.update.dataSchema as { required: string[] };
    expect(sentDataSchema.required).toContain('lastName');
  });

  it('applies uiSchemaOps and sends the patched uiSchema', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });

    await tools.formSchemaPatch.execute(
      {
        uiSchemaOps: [
          {
            op: 'add',
            path: '/elements/0/elements/-',
            value: { type: 'Control', scope: '#/properties/age' },
          },
        ],
      },
      ctx,
    );

    const body = mockedAxios.patch.mock.calls[0][1] as { update: Record<string, unknown> };
    const sentUiSchema = body.update.uiSchema as { elements: Array<{ elements: unknown[] }> };
    expect(sentUiSchema.elements[0].elements).toHaveLength(3);
  });

  it('returns success: true with opsApplied count and formDefinitionId', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });

    const result = await tools.formSchemaPatch.execute(
      {
        dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }],
        uiSchemaOps: [{ op: 'replace', path: '/elements/0/label', value: 'Updated' }],
      },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.opsApplied).toBe(2);
    expect(result.formDefinitionId).toBe('intake-form');
  });

  it('counts ops from both arrays in opsApplied', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });

    const result = await tools.formSchemaPatch.execute(
      {
        dataSchemaOps: [
          { op: 'add', path: '/required/-', value: 'lastName' },
          { op: 'add', path: '/required/-', value: 'age' },
        ],
        uiSchemaOps: [{ op: 'replace', path: '/elements/0/label', value: 'Updated' }],
      },
      ctx,
    );

    expect(result.opsApplied).toBe(3);
  });

  describe('sortRemoveOps — multiple removes on the same uiSchema array', () => {
    it('removes multiple elements from a uiSchema array without pointer-shift errors', async () => {
      const schemaWithFourElements = {
        dataSchema: { type: 'object', required: [], properties: {} },
        uiSchema: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/a' },
            { type: 'Control', scope: '#/properties/b' },
            { type: 'Control', scope: '#/properties/c' },
            { type: 'Control', scope: '#/properties/d' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValueOnce({ data: schemaWithFourElements });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });

      // Ascending order — sortRemoveOps must reorder to descending to avoid pointer shifts
      await tools.formSchemaPatch.execute(
        {
          uiSchemaOps: [
            { op: 'remove', path: '/elements/1' }, // b
            { op: 'remove', path: '/elements/3' }, // d
          ],
        },
        ctx,
      );

      const body = mockedAxios.patch.mock.calls[0][1] as { update: Record<string, unknown> };
      const sent = body.update.uiSchema as { elements: Array<{ scope: string }> };
      expect(sent.elements).toHaveLength(2);
      expect(sent.elements[0].scope).toBe('#/properties/a');
      expect(sent.elements[1].scope).toBe('#/properties/c');
    });

    it('preserves non-remove ops in their original positions relative to remove ops', async () => {
      const schemaWithTwoElements = {
        dataSchema: { type: 'object', required: [], properties: {} },
        uiSchema: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/a', label: 'A' },
            { type: 'Control', scope: '#/properties/b', label: 'B' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValueOnce({ data: schemaWithTwoElements });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });

      await tools.formSchemaPatch.execute(
        {
          uiSchemaOps: [
            { op: 'replace', path: '/elements/0/label', value: 'Alpha' },
            { op: 'remove', path: '/elements/1' },
          ],
        },
        ctx,
      );

      const body = mockedAxios.patch.mock.calls[0][1] as { update: Record<string, unknown> };
      const sent = body.update.uiSchema as { elements: Array<{ scope: string; label: string }> };
      expect(sent.elements).toHaveLength(1);
      expect(sent.elements[0].label).toBe('Alpha');
    });
  });

  describe('error handling', () => {
    it('silently skips a remove op targeting a non-existent dataSchema path', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });

      const result = await tools.formSchemaPatch.execute(
        { dataSchemaOps: [{ op: 'remove', path: '/required/99' }] },
        ctx,
      );

      expect(result.success).toBe(true);
    });

    it('silently skips a remove op targeting a non-existent uiSchema path', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });

      const result = await tools.formSchemaPatch.execute(
        { uiSchemaOps: [{ op: 'remove', path: '/elements/99' }] },
        ctx,
      );

      expect(result.success).toBe(true);
    });

    it('throws a schema validation error on 400 from the config service', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
      mockedAxios.patch.mockRejectedValueOnce(makeAxiosError(400, 'Does not match schema'));

      await expect(
        tools.formSchemaPatch.execute(
          { dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }] },
          ctx,
        ),
      ).rejects.toThrow('Schema validation failed after patch');
    });

    it('throws a permission error on 403 from the config service', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
      mockedAxios.patch.mockRejectedValueOnce(makeAxiosError(403, 'Forbidden'));

      await expect(
        tools.formSchemaPatch.execute(
          { dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }] },
          ctx,
        ),
      ).rejects.toThrow('Permission denied');
    });

    it('throws a config service error for other Axios errors that carry a message', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
      mockedAxios.patch.mockRejectedValueOnce(makeAxiosError(500, 'Internal server error'));

      await expect(
        tools.formSchemaPatch.execute(
          { dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }] },
          ctx,
        ),
      ).rejects.toThrow('Configuration service error: Internal server error');
    });

    it('throws a generic error for non-Axios failures', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: currentSchema });
      mockedAxios.patch.mockRejectedValueOnce(new Error('network down'));

      await expect(
        tools.formSchemaPatch.execute(
          { dataSchemaOps: [{ op: 'add', path: '/required/-', value: 'lastName' }] },
          ctx,
        ),
      ).rejects.toThrow('Failed to patch form schema: network down');
    });
  });
});
