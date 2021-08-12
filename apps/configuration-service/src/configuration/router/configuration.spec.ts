import { adspId, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { ServiceConfigurationEntity } from '../model';
import { ConfigurationServiceRoles } from '../roles';
import {
  createConfigurationRouter,
  createServiceConfigurationRevision,
  getServiceConfiguration,
  getServiceConfigurationEntity,
  patchServiceConfigurationRevision,
} from './configuration';

describe('router', () => {
  const configurationServiceId = adspId`urn:ads:platform:configuration-service`;
  const serviceId = adspId`urn:ads:platform:test-service`;
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
        serviceId,
        eventService: eventServiceMock,
        logger: loggerMock as Logger,
        configuration: repositoryMock,
      });

      expect(router).toBeTruthy();
    });
  });

  describe('getServiceConfigurationEntity', () => {
    it('can create handler', () => {
      const handler = getServiceConfigurationEntity(configurationServiceId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get entity', (done) => {
      const handler = getServiceConfigurationEntity(configurationServiceId, repositoryMock, () => true);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock)
      );
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock, null, tenantId)
      );

      const entity = new ServiceConfigurationEntity(serviceId, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        done();
      });
    });

    it('can get tenant entity', (done) => {
      const handler = getServiceConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock)
      );
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock, null, tenantId)
      );

      const entity = new ServiceConfigurationEntity(serviceId, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
        query: { tenantId: tenantId.toString() },
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[2][1].toString()).toEqual(tenantId.toString());
        done();
      });
    });

    it('can return error for unauthorized', (done) => {
      const handler = getServiceConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock)
      );
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock, null, tenantId)
      );

      const entity = new ServiceConfigurationEntity(serviceId, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
        query: {},
      } as unknown) as Request;

      handler(req, null, (err) => {
        expect(err).toBeTruthy();
        done();
      });
    });

    it('can get entity with core definition', (done) => {
      const handler = getServiceConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock, {
          revision: 1,
          configuration: {
            [serviceId.toString()]: { configurationSchema },
          },
        })
      );

      const entity = new ServiceConfigurationEntity(serviceId, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[1][2]).toBe(configurationSchema);
        done();
      });
    });

    it('can get entity with tenant definition', (done) => {
      const handler = getServiceConfigurationEntity(configurationServiceId, repositoryMock, () => false);

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(configurationServiceId, repositoryMock, validationMock)
      );
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ServiceConfigurationEntity(
          configurationServiceId,
          repositoryMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [serviceId.toString()]: { configurationSchema },
            },
          },
          tenantId
        )
      );

      const entity = new ServiceConfigurationEntity(serviceId, repositoryMock, validationMock, null, tenantId);
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = ({
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
        query: {},
      } as unknown) as Request;

      handler(req, null, () => {
        expect(req['entity']).toBe(entity);
        expect(repositoryMock.get.mock.calls[2][2]).toBe(configurationSchema);
        done();
      });
    });
  });

  describe('getServiceConfiguration', () => {
    it('can create handler', () => {
      const handler = getServiceConfiguration();
      expect(handler).toBeTruthy();
    });

    it('can get configuration', () => {
      const handler = getServiceConfiguration();

      const entity = new ServiceConfigurationEntity(serviceId, repositoryMock, validationMock, null, tenantId);

      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
        query: {},
      } as unknown) as Request;

      const res = {
        send: jest.fn(),
      };

      handler(req, (res as unknown) as Response, jest.fn());
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ latest: null, serviceId: serviceId.toString() }));
    });
  });

  describe('patchServiceConfigurationRevision', () => {
    it('can create handler', () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining({ ...req.body.update, old: 'old' }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle no existing revision on update', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining(req.body.update));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for update missing value', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.update).toHaveBeenCalledWith(
        req.user,
        expect.objectContaining<{ value: string }>(req.body.configuration)
      );
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for replace without value', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.not.objectContaining(entity.latest.configuration));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle no existing revision on delete', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining({}));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle missing property on delete', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining(entity.latest.configuration));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for delete without property', async () => {
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      const handler = patchServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      const handler = createServiceConfigurationRevision(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create revision', async () => {
      const handler = createServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: {} },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.createRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can create first revision', async () => {
      const handler = createServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ serviceId: serviceId.toString(), latest: entity.latest })
      );
      expect(entity.createRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for unrecognized request', async () => {
      const handler = createServiceConfigurationRevision(eventServiceMock);

      const entity = {
        tenantId,
        serviceId,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: {} },
      };
      const req = ({
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace: serviceId.namespace, service: serviceId.service },
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
});
