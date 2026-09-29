import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { ConfigurationClient, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { EventServiceRoles } from '../role';
import {
  assertValidJsonSchema,
  createDefinition,
  createDefinitionRouter,
  deleteDefinition,
  EventConfiguration,
  findDefinition,
  findDefinitions,
  mergeDefinition,
  removeDefinition,
  updateDefinition,
} from './definition';

describe('definition router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const admin = { id: 'admin', tenantId, roles: [EventServiceRoles.admin], isCore: false };
  const noRoles = { id: 'none', tenantId, roles: [], isCore: false };

  const definition = { name: 'user-registration', description: 'A user registered', payloadSchema: { type: 'object' } };
  const tenantConfiguration = {
    'application-events': { name: 'application-events', definitions: { 'user-registration': definition } },
  } as unknown as EventConfiguration;
  const coreConfiguration = {
    core: { name: 'core', definitions: { 'core-event': { ...definition, name: 'core-event' } } },
  } as unknown as EventConfiguration;

  const clientMock = {
    getTenantConfiguration: jest.fn(),
    getCoreConfiguration: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  };
  const client = clientMock as unknown as ConfigurationClient<EventConfiguration>;
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
      const result = mergeDefinition(tenantConfiguration, 'application-events', { ...definition, name: 'other' });
      expect(Object.keys(result.definitions)).toEqual(['user-registration', 'other']);
      expect(result.name).toBe('application-events');
    });

    it('creates new namespace', () => {
      const result = mergeDefinition({}, 'new', definition);
      expect(result).toEqual({ name: 'new', definitions: { 'user-registration': definition } });
    });
  });

  describe('removeDefinition', () => {
    it('removes definition from namespace', () => {
      expect(removeDefinition(tenantConfiguration, 'application-events', 'user-registration')).toEqual({
        name: 'application-events',
        definitions: {},
      });
    });

    it('handles missing namespace', () => {
      expect(removeDefinition({}, 'application-events', 'user-registration')).toEqual({
        name: 'application-events',
        definitions: {},
      });
    });
  });

  describe('assertValidJsonSchema', () => {
    it('passes for valid schema', () => {
      expect(() => assertValidJsonSchema(validationServiceMock, 'application-events', definition)).not.toThrow();
      expect(validationServiceMock.setSchema).toHaveBeenCalledWith(expect.any(String), definition.payloadSchema);
    });

    it('throws for invalid schema', () => {
      validationServiceMock.setSchema.mockImplementationOnce(() => {
        throw new Error('schema is invalid');
      });
      expect(() => assertValidJsonSchema(validationServiceMock, 'application-events', definition)).toThrow(
        InvalidOperationError,
      );
    });
  });

  describe('findDefinitions', () => {
    it('returns tenant and core definitions as a flat array', async () => {
      await findDefinitions(client)(createRequest({}), res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith([
        { ...definition, namespace: 'application-events', isCore: false },
        { ...definition, name: 'core-event', namespace: 'core', isCore: true },
      ]);
    });

    it('returns only core definitions without tenant context', async () => {
      await findDefinitions(client)(createRequest({ tenant: undefined }), res as unknown as Response, next);
      expect(clientMock.getTenantConfiguration).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith([{ ...definition, name: 'core-event', namespace: 'core', isCore: true }]);
    });
  });

  describe('findDefinition', () => {
    const handler = findDefinition(client);

    it('returns a tenant definition', async () => {
      await handler(
        createRequest({ params: { namespace: 'application-events', name: 'user-registration' } }),
        res as unknown as Response,
        next,
      );

      expect(res.send).toHaveBeenCalledWith({ ...definition, namespace: 'application-events', isCore: false });
    });

    it('returns a core definition when not found in tenant', async () => {
      await handler(
        createRequest({ params: { namespace: 'core', name: 'core-event' } }),
        res as unknown as Response,
        next,
      );

      expect(res.send).toHaveBeenCalledWith({
        ...definition,
        name: 'core-event',
        namespace: 'core',
        isCore: true,
      });
    });

    it('returns not found for a missing definition', async () => {
      await handler(
        createRequest({ params: { namespace: 'application-events', name: 'missing' } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('createDefinition', () => {
    const handler = createDefinition(client, validationServiceMock);

    it('creates a new definition in the tenant configuration', async () => {
      const created = { ...definition, name: 'new-event' };
      clientMock.updateEntry.mockImplementationOnce((_tenantId, _key, namespace) =>
        Promise.resolve({ [namespace.name]: namespace }),
      );

      await handler(
        createRequest({
          user: admin,
          body: {
            namespace: 'application-events',
            name: created.name,
            description: created.description,
            payloadSchema: created.payloadSchema,
          },
        }),
        res as unknown as Response,
        next,
      );

      expect(clientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'application-events', {
        name: 'application-events',
        definitions: { 'user-registration': definition, 'new-event': created },
      });
      expect(res.send).toHaveBeenCalledWith({ ...created, namespace: 'application-events', isCore: false });
    });

    it('rejects a definition that already exists', async () => {
      await handler(
        createRequest({
          user: admin,
          body: {
            namespace: 'application-events',
            name: definition.name,
            description: definition.description,
            payloadSchema: definition.payloadSchema,
          },
        }),
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
        createRequest({
          user: admin,
          body: { namespace: 'application-events', name: 'new-event', description: 'Test', payloadSchema: {} },
        }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('rejects user without admin role', async () => {
      await handler(
        createRequest({
          user: noRoles,
          body: { namespace: 'application-events', name: 'new-event', description: 'Test', payloadSchema: {} },
        }),
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
          body: { namespace: 'application-events', name: 'new-event', description: 'Test', payloadSchema: {} },
        }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('updateDefinition', () => {
    const handler = updateDefinition(client, validationServiceMock);

    it('replaces an existing definition in the tenant configuration', async () => {
      const updated = { ...definition, description: 'Updated description' };
      clientMock.updateEntry.mockImplementationOnce((_tenantId, _key, namespace) =>
        Promise.resolve({ [namespace.name]: namespace }),
      );

      await handler(
        createRequest({
          user: admin,
          params: { namespace: 'application-events', name: 'user-registration' },
          body: { description: updated.description, payloadSchema: updated.payloadSchema },
        }),
        res as unknown as Response,
        next,
      );

      expect(clientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'application-events', {
        name: 'application-events',
        definitions: { 'user-registration': updated },
      });
      expect(res.send).toHaveBeenCalledWith({ ...updated, namespace: 'application-events', isCore: false });
    });

    it('returns not found for a missing definition', async () => {
      await handler(
        createRequest({
          user: admin,
          params: { namespace: 'application-events', name: 'missing' },
          body: { description: 'Test', payloadSchema: {} },
        }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('rejects invalid json schema', async () => {
      validationServiceMock.setSchema.mockImplementationOnce(() => {
        throw new Error('schema is invalid');
      });

      await handler(
        createRequest({
          user: admin,
          params: { namespace: 'application-events', name: 'user-registration' },
          body: { description: 'Test', payloadSchema: {} },
        }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('rejects user without admin role', async () => {
      await handler(
        createRequest({
          user: noRoles,
          params: { namespace: 'application-events', name: 'user-registration' },
          body: { description: 'Test', payloadSchema: {} },
        }),
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
          params: { namespace: 'application-events', name: 'user-registration' },
          body: { description: 'Test', payloadSchema: {} },
        }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('deleteDefinition', () => {
    const handler = deleteDefinition(client);

    it('deletes the namespace entry when it is the last definition', async () => {
      await handler(
        createRequest({ user: admin, params: { namespace: 'application-events', name: 'user-registration' } }),
        res as unknown as Response,
        next,
      );

      expect(clientMock.deleteEntry).toHaveBeenCalledWith(tenantId, 'application-events');
      expect(clientMock.updateEntry).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ deleted: true });
    });

    it('updates the namespace entry when other definitions remain', async () => {
      const multiDefinitionConfig = {
        'application-events': {
          name: 'application-events',
          definitions: { 'user-registration': definition, 'other-event': { ...definition, name: 'other-event' } },
        },
      } as unknown as EventConfiguration;
      clientMock.getTenantConfiguration.mockResolvedValue(multiDefinitionConfig);

      await handler(
        createRequest({ user: admin, params: { namespace: 'application-events', name: 'user-registration' } }),
        res as unknown as Response,
        next,
      );

      expect(clientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'application-events', {
        name: 'application-events',
        definitions: { 'other-event': { ...definition, name: 'other-event' } },
      });
      expect(clientMock.deleteEntry).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ deleted: true });
    });

    it('returns not found for a missing definition', async () => {
      await handler(
        createRequest({ user: admin, params: { namespace: 'application-events', name: 'missing' } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('rejects user without admin role', async () => {
      await handler(
        createRequest({ user: noRoles, params: { namespace: 'application-events', name: 'user-registration' } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
