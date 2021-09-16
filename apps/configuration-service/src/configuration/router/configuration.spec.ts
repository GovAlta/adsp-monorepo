import { adspId, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { ConfigurationEntity } from '../model';
import { ConfigurationServiceRoles } from '../roles';
import {
  createConfigurationRouter,
  createConfigurationRevision,
  getConfiguration,
  getConfigurationEntity,
  patchConfigurationRevision,
  getRevisions,
} from './configuration';

describe('router', () => {
  const configurationServiceId = adspId`urn:ads:platform:configuration-service`;
  const namespace = 'platform';
  const name = 'test-service';
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown;

  const eventServiceMock = {
    send: jest.fn(),
  };

  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const repositoryMock = {
    get: jest.fn(),
    getRevisions: jest.fn(),
    saveRevision: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.get.mockClear();
    eventServiceMock.send.mockClear();
  });

  describe('createConfigurationRouter', () => {
    it('can create router', () => {
      const router = createConfigurationRouter({
        isConnected: () => true,
        serviceId: adspId`urn:ads:platform:configuration-service`,
        eventService: eventServiceMock,
        logger: loggerMock as Logger,
        configuration: repositoryMock,
      });

      expect(router).toBeTruthy();
    });
  });

  describe('getServiceConfigurationEntity', () => {
    it('can create handler', () => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get entity', (done) => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock, () => true);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock
        )
      );
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock,
          null,
          tenantId
        )
      );

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        done();
      });
    });

    it('can get tenant entity', (done) => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock
        )
      );
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock,
          null,
          tenantId
        )
      );

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User,
        params: { namespace, name },
        query: { tenantId: tenantId.toString() },
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[2][2].toString()).toEqual(tenantId.toString());
        done();
      });
    });

    it('can return error for unauthorized', (done) => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock
        )
      );
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock,
          null,
          tenantId
        )
      );

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown) as Request;

      handler(req, null, (err) => {
        expect(err).toBeTruthy();
        done();
      });
    });

    it('can get entity with core definition', (done) => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [`${namespace}:${name}`]: { configurationSchema },
            },
          }
        )
      );

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[1][3]).toBe(configurationSchema);
        done();
      });
    });

    it('can get entity with tenant definition', (done) => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock
        )
      );
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [`${namespace}:${name}`]: { configurationSchema },
              [namespace]: { configurationSchema: {} },
            },
          },
          tenantId
        )
      );

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[2][3]).toBe(configurationSchema);
        done();
      });
    });

    it('can get entity with tenant namespace definition', (done) => {
      const handler = getConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock
        )
      );
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          repositoryMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [namespace]: { configurationSchema },
            },
          },
          tenantId
        )
      );

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[2][3]).toBe(configurationSchema);
        done();
      });
    });
  });

  describe('getServiceConfiguration', () => {
    it('can create handler', () => {
      const handler = getConfiguration();
      expect(handler).toBeTruthy();
    });

    it('can get configuration', () => {
      const handler = getConfiguration();

      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);

      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      handler(req, (res as unknown) as Response, jest.fn());
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ latest: null, namespace, name }));
    });
  });

  describe('patchServiceConfigurationRevision', () => {
    it('can create handler', () => {
      const handler = patchConfigurationRevision(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
          update: {
            value: 'value',
          },
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining({ ...req.body.update, old: 'old' }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle no existing revision on update', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
          update: {
            value: 'value',
          },
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining(req.body.update));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for update missing value', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });

    it('can replace', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'REPLACE',
          configuration: {
            value: 'value',
          },
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(
        req.user,
        expect.objectContaining<{ value: string }>(req.body.configuration)
      );
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for replace without value', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'REPLACE',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });

    it('can delete', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'old',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.not.objectContaining({ old: 'old' }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle no existing revision on delete', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'missing',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining({}));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle missing property on delete', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'missing',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining(entity.latest.configuration));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for delete without property', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });

    it('can return error for unrecognized operation', async () => {
      const handler = patchConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'NOP',
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });
  });

  describe('createServiceConfigurationRevision', () => {
    it('can create handler', () => {
      const handler = createConfigurationRevision(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create revision', async () => {
      const handler = createConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: {} },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          revision: true,
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.createRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can create first revision', async () => {
      const handler = createConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          revision: true,
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.createRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for unrecognized request', async () => {
      const handler = createConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: {} },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {},
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getRevisions', () => {
    it('can create handler', () => {
      const handler = getRevisions();
      expect(handler).toBeTruthy();
    });

    it('can get revisions', async () => {
      const handler = getRevisions();

      const entity = {
        tenantId,
        namespace,
        name,
        getRevisions: jest.fn(),
        latest: { revision: 1, configuration: {} },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: { top: '12', after: '123' },
        body: {
          revision: true,
        },
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      const result = {};
      entity.getRevisions.mockResolvedValueOnce(result);
      await handler(req, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(result);
      expect(entity.getRevisions).toHaveBeenCalledWith(12, '123', {});
    });
  });
});
