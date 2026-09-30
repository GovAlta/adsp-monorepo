import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { ConfigurationClient, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { ServiceUserRoles, ValueConfiguration } from '../types';
import {
  assertValidJsonSchema,
  createDefinition,
  createDefinitionRouter,
  deleteDefinition,
  findDefinitions,
  getDefinition,
  mergeDefinition,
  removeDefinition,
  updateDefinition,
} from './definition';

describe('definition router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const admin = { id: 'admin', tenantId, roles: [ServiceUserRoles.Writer], isCore: false };
  const reader = { id: 'reader', tenantId, roles: [ServiceUserRoles.Reader], isCore: false };
  const noRoles = { id: 'none', tenantId, roles: [], isCore: false };

  const definition = { name: 'test-value', description: 'Test value', jsonSchema: { type: 'object' } };
  const tenantConfiguration = {
    test: { name: 'test', definitions: { 'test-value': definition } },
  } as unknown as ValueConfiguration;
  const coreConfiguration = {
    core: { name: 'core', definitions: { 'core-value': { ...definition, name: 'core-value' } } },
  };

  const clientMock = {
    getTenantConfiguration: jest.fn(),
    getCoreConfiguration: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  };
  const client = clientMock as unknown as ConfigurationClient<ValueConfiguration>;
  const validationServiceMock = { setSchema: jest.fn(), validate: jest.fn() };

  const res = {
    send: jest.fn(),
    status: jest.fn(),
  };
  const next = jest.fn();

  const createRequest = (props: Record<string, unknown>) =>
    ({ tenant: { id: tenantId }, params: {}, body: {}, ...props }) as unknown as Request;

  beforeEach(() => {
    Object.values(clientMock).forEach((mock) => mock.mockReset());
    validationServiceMock.setSchema.mockReset();
    res.send.mockReset();
    res.status.mockReset();
    res.status.mockReturnValue(res);
    next.mockReset();
    clientMock.getTenantConfiguration.mockResolvedValue(tenantConfiguration);
    clientMock.getCoreConfiguration.mockResolvedValue(coreConfiguration);
  });

  it('can create router', () => {
    expect(createDefinitionRouter({ client, validationService: validationServiceMock })).toBeTruthy();
  });

  describe('mergeDefinition', () => {
    it('adds definition to existing namespace', () => {
      const result = mergeDefinition(tenantConfiguration, 'test', { ...definition, name: 'other' });
      expect(Object.keys(result.definitions)).toEqual(['test-value', 'other']);
      expect(result.name).toBe('test');
    });

    it('creates new namespace', () => {
      const result = mergeDefinition({}, 'new', definition);
      expect(result).toEqual({ name: 'new', definitions: { 'test-value': definition } });
    });

    it('keeps only configuration schema properties', () => {
      const result = mergeDefinition({}, 'new', {
        ...definition,
        description: undefined,
        displayName: 'Test',
        sendWriteEvent: true,
        isCore: false,
      } as never);
      expect(result.definitions['test-value']).toEqual({
        name: 'test-value',
        description: '',
        jsonSchema: definition.jsonSchema,
        displayName: 'Test',
        sendWriteEvent: true,
      });
    });
  });

  describe('removeDefinition', () => {
    it('removes definition from namespace', () => {
      expect(removeDefinition(tenantConfiguration, 'test', 'test-value')).toEqual({ name: 'test', definitions: {} });
    });

    it('handles missing namespace', () => {
      expect(removeDefinition({}, 'test', 'test-value')).toEqual({ name: 'test', definitions: {} });
    });
  });

  describe('assertValidJsonSchema', () => {
    it('passes for valid schema', () => {
      expect(() => assertValidJsonSchema(validationServiceMock, 'test', definition)).not.toThrow();
      expect(validationServiceMock.setSchema).toHaveBeenCalledWith(expect.any(String), definition.jsonSchema);
    });

    it('throws for invalid schema', () => {
      validationServiceMock.setSchema.mockImplementationOnce(() => {
        throw new Error('schema is invalid');
      });
      expect(() => assertValidJsonSchema(validationServiceMock, 'test', definition)).toThrow(InvalidOperationError);
    });
  });

  describe('findDefinitions', () => {
    it('returns tenant and core definitions', async () => {
      await findDefinitions(client)(createRequest({ user: reader }), res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith({ tenant: tenantConfiguration, core: coreConfiguration });
    });

    it('returns only core definitions without tenant context', async () => {
      await findDefinitions(client)(
        createRequest({ user: { ...reader, isCore: true, tenantId: undefined }, tenant: undefined }),
        res as unknown as Response,
        next,
      );
      expect(clientMock.getTenantConfiguration).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ tenant: {}, core: coreConfiguration });
    });

    it('rejects user without role', async () => {
      await findDefinitions(client)(createRequest({ user: noRoles }), res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getDefinition', () => {
    it('returns tenant definition', async () => {
      await getDefinition(client)(
        createRequest({ user: reader, params: { namespace: 'test', name: 'test-value' } }),
        res as unknown as Response,
        next,
      );
      expect(res.send).toHaveBeenCalledWith({ ...definition, namespace: 'test', isCore: false });
    });

    it('returns core definition', async () => {
      await getDefinition(client)(
        createRequest({ user: reader, params: { namespace: 'core', name: 'core-value' } }),
        res as unknown as Response,
        next,
      );
      expect(res.send).toHaveBeenCalledWith({ ...definition, name: 'core-value', namespace: 'core', isCore: true });
    });

    it('returns not found', async () => {
      await getDefinition(client)(
        createRequest({ user: reader, params: { namespace: 'test', name: 'missing' } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('createDefinition', () => {
    const handler = createDefinition(client, validationServiceMock);

    it('creates definition in namespace', async () => {
      const created = { ...definition, name: 'new-value' };
      clientMock.updateEntry.mockImplementationOnce((_tenantId, _key, namespace) =>
        Promise.resolve({ [namespace.name]: namespace }),
      );

      await handler(
        createRequest({ user: admin, body: { namespace: 'test', ...created } }),
        res as unknown as Response,
        next,
      );

      expect(clientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'test', {
        name: 'test',
        definitions: { 'test-value': definition, 'new-value': created },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({ ...created, namespace: 'test', isCore: false });
    });

    it('rejects existing tenant definition with conflict', async () => {
      await handler(
        createRequest({ user: admin, body: { namespace: 'test', ...definition } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 409 }) }),
      );
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('rejects existing core definition with conflict', async () => {
      await handler(
        createRequest({ user: admin, body: { namespace: 'core', ...definition, name: 'core-value' } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('rejects invalid json schema', async () => {
      validationServiceMock.setSchema.mockImplementationOnce(() => {
        throw new Error('schema is invalid');
      });
      await handler(
        createRequest({ user: admin, body: { namespace: 'test', ...definition, name: 'new-value' } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('rejects reader', async () => {
      await handler(
        createRequest({ user: reader, body: { namespace: 'test', ...definition } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('requires tenant context', async () => {
      await handler(
        createRequest({
          user: { ...admin, isCore: true },
          tenant: undefined,
          body: { namespace: 'test', ...definition },
        }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('updateDefinition', () => {
    const handler = updateDefinition(client, validationServiceMock);

    it('updates definition', async () => {
      clientMock.updateEntry.mockImplementationOnce((_tenantId, _key, namespace) =>
        Promise.resolve({ [namespace.name]: namespace }),
      );

      await handler(
        createRequest({
          user: admin,
          params: { namespace: 'test', name: 'test-value' },
          body: { description: 'Updated', name: 'ignored' },
        }),
        res as unknown as Response,
        next,
      );

      expect(clientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'test', {
        name: 'test',
        definitions: { 'test-value': { ...definition, description: 'Updated' } },
      });
      expect(res.send).toHaveBeenCalledWith({
        ...definition,
        description: 'Updated',
        namespace: 'test',
        isCore: false,
      });
    });

    it('returns not found', async () => {
      await handler(
        createRequest({ user: admin, params: { namespace: 'test', name: 'missing' }, body: {} }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('rejects reader', async () => {
      await handler(
        createRequest({ user: reader, params: { namespace: 'test', name: 'test-value' }, body: {} }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteDefinition', () => {
    const handler = deleteDefinition(client);

    it('deletes namespace when last definition is removed', async () => {
      await handler(
        createRequest({ user: admin, params: { namespace: 'test', name: 'test-value' } }),
        res as unknown as Response,
        next,
      );
      expect(clientMock.deleteEntry).toHaveBeenCalledWith(tenantId, 'test');
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ deleted: true });
    });

    it('updates namespace when other definitions remain', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({
        test: { name: 'test', definitions: { 'test-value': definition, other: { ...definition, name: 'other' } } },
      });
      await handler(
        createRequest({ user: admin, params: { namespace: 'test', name: 'test-value' } }),
        res as unknown as Response,
        next,
      );
      expect(clientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'test', {
        name: 'test',
        definitions: { other: { ...definition, name: 'other' } },
      });
      expect(clientMock.deleteEntry).not.toHaveBeenCalled();
    });

    it('returns not found', async () => {
      await handler(
        createRequest({ user: admin, params: { namespace: 'test', name: 'missing' } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('rejects reader', async () => {
      await handler(
        createRequest({ user: reader, params: { namespace: 'test', name: 'test-value' } }),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
