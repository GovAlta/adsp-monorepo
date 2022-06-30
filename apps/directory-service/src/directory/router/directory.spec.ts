import { adspId, User } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { DirectoryEntity } from '../model';
import { ServiceRoles } from '../roles';
import * as HttpStatusCodes from 'http-status-codes';
import {
  createDirectoryRouter,
  getDirectoriesByNamespace,
  getEntriesForService,
  getDirectoryEntryForApi,
  createNameSpace,
  addService,
  addServiceApi,
  updateService,
  updateApi,
  deleteService,
  deleteApi,
  getServiceMetadata,
} from './directory';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
describe('router', () => {
  const namespace = 'platform';
  const name = 'test-service';
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown;

  const eventServiceMock = {
    send: jest.fn(),
  };
  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const repositoryMock = {
    find: jest.fn(),
    getDirectories: jest.fn(),
    exists: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };

  const platformDirectoryRes = [
    {
      namespace: 'platform',
      service: 'test-service:v2',
      url: '/test/service/v2',
      urn: 'urn:ads:platform:test-service:v2',
    },
    { namespace: 'platform', service: 'file-service', url: '/file/service', urn: 'urn:ads:platform:file-service' },
  ];

  beforeEach(() => {
    repositoryMock.getDirectories.mockClear();
    eventServiceMock.send.mockClear();
  });
  describe('createConfigurationRouter', () => {
    it('can create router', () => {
      const router = createDirectoryRouter({
        logger: loggerMock as Logger,
        directoryRepository: repositoryMock,
        tenantService: tenantServiceMock,
        eventService: eventServiceMock,
      });

      expect(router).toBeTruthy();
    });
  });
  describe('getDirectoriesByNamespace', () => {
    it('can create handler', () => {
      const handler = getDirectoriesByNamespace(repositoryMock);
      expect(handler).toBeTruthy();
    });
    it('can get directories by namespace', async () => {
      const handler = getDirectoriesByNamespace(repositoryMock);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service:v2', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(platformDirectoryRes));
    });
    it('can call next with not found', async () => {
      const handler = getDirectoriesByNamespace(repositoryMock);
      const testDirectory = {
        name: 'platform',
        services: null,
      };
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getEntriesForService', () => {
    it('can create handler', () => {
      const handler = getEntriesForService(repositoryMock);
      expect(handler).toBeTruthy();
    });
    it('can get entries by namespace and service', async () => {
      const handler = getEntriesForService(repositoryMock);
      const service = 'test-service';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, service },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service', host: '/test/service' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      const testServiceRes = [
        {
          namespace: 'platform',
          service: 'test-service',
          url: '/test/service',
          urn: 'urn:ads:platform:test-service',
        },
      ];
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(testServiceRes));
    });
    it('getEntriesForService can call next with not found', async () => {
      const handler = getEntriesForService(repositoryMock);
      const testDirectory = {
        name: 'platform',
        services: null,
      };
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getDirectoryEntryForApi', () => {
    it('can create handler', () => {
      const handler = getDirectoryEntryForApi(repositoryMock);
      expect(handler).toBeTruthy();
    });
    it('can get entries by namespace , service and api', async () => {
      const handler = getDirectoryEntryForApi(repositoryMock);
      const service = 'test-service';
      const api = 'v2';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, service, api },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };

      const testServiceRes = {
        namespace: 'platform',
        service: 'test-service:v2',
        url: '/test/service/v2',
        urn: 'urn:ads:platform:test-service:v2',
      };
      const next = jest.fn();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service:v2', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(testServiceRes));
    });
    it('getDirectoryEntryForApi can call next with not found', async () => {
      const handler = getDirectoryEntryForApi(repositoryMock);
      const testDirectory = {
        name: 'platform',
        services: null,
      };
      const api = 'v2';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, name, api },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('getServiceMetadata', () => {
    it('can create handler', () => {
      const handler = getServiceMetadata(repositoryMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });
    it('can get service metadata by service', async () => {
      const handler = getServiceMetadata(repositoryMock, loggerMock as Logger);

      const cacheMock = jest.fn();
      jest.mock('node-cache', () => {
        return class FakeCache {
          get = cacheMock;
          set = jest.fn();
          keys = jest.fn(() => ['platform']);
        };
      });

      const service = 'file-service';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, service },
        query: {},
      } as unknown as Request;

      const res = {
        status: jest.fn(),
        json: jest.fn(),
      };
      const metadata = {
        name: 'Event service',
        description: 'Service for sending of domain events.',
        _links: {
          self: {
            href: 'https://event-service.adsp-dev.gov.ab.ca/',
          },
          health: {
            href: 'https://event-service.adsp-dev.gov.ab.ca/health',
          },
          api: {
            href: 'https://event-service.adsp-dev.gov.ab.ca/event/v1',
          },
          docs: {
            href: 'https://event-service.adsp-dev.gov.ab.ca/swagger/docs/v1',
          },
        },
      };
      const response = {
        host: '/file/service',
        metadata: {
          _links: {
            api: { href: 'https://event-service.adsp-dev.gov.ab.ca/event/v1' },
            docs: { href: 'https://event-service.adsp-dev.gov.ab.ca/swagger/docs/v1' },
            health: { href: 'https://event-service.adsp-dev.gov.ab.ca/health' },
            self: { href: 'https://event-service.adsp-dev.gov.ab.ca/' },
          },
          description: 'Service for sending of domain events.',
          name: 'Event service',
        },
        service: 'file-service',
      };
      const next = jest.fn();
      repositoryMock.getDirectories.mockClear();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'event-service', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };

      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      axiosMock.get.mockResolvedValueOnce({ data: metadata });

      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(response));
    });
  });

  describe('createNameSpace', () => {
    it('can create handler', () => {
      const handler = createNameSpace(repositoryMock, tenantServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });
    it('can create namespace by post', async () => {
      const handler = createNameSpace(repositoryMock, tenantServiceMock, loggerMock as Logger);
      const tenantId = adspId`urn:ads:test:tenant-service:v2:/tenants/test`;
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: {},
        query: {},
      } as unknown as Request;
      const res = {
        sendStatus: jest.fn(),
      };
      const next = jest.fn();
      repositoryMock.getDirectories.mockResolvedValueOnce(null);
      repositoryMock.update.mockResolvedValueOnce({ name: test, services: [] });
      await handler(req, res as unknown as Response, next);
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
    });
    it('createNameSpace can call next with not found', async () => {
      const handler = createNameSpace(repositoryMock, tenantServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('addService', () => {
    it('can create handler', () => {
      const handler = addService(repositoryMock, eventServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });
    it('can add service by post', async () => {
      const handler = addService(repositoryMock, eventServiceMock, loggerMock as Logger);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          service: 'added-service',
          host: '/add-service/core',
        },
      } as unknown as Request;
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      };
      const next = jest.fn();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service:v2', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.update.mockResolvedValueOnce({
        name: 'platform',
        services: [{ service: 'added-service', host: '/add-service/core' }],
      });
      await handler(req, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
    });
    it('addService can call next with not found', async () => {
      const handler = addService(repositoryMock, eventServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('addServiceApi', () => {
    it('can create handler', () => {
      const handler = addServiceApi(repositoryMock, eventServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });
    it('can add ServiceApi by post', async () => {
      const handler = addServiceApi(repositoryMock, eventServiceMock, loggerMock as Logger);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          service: 'added-service',
          host: '/add-service/core',
        },
      } as unknown as Request;
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      };
      const next = jest.fn();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service:v2', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.update.mockResolvedValueOnce({
        name: 'platform',
        services: [{ service: 'added-service', host: '/add-service/core' }],
      });
      await handler(req, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
    });
    it('addServiceApi can call next with not found', async () => {
      const handler = addServiceApi(repositoryMock, eventServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('updateService', () => {
    it('can create handler', () => {
      const handler = updateService(repositoryMock, eventServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });
    it('can update Service by namespace', async () => {
      const handler = updateService(repositoryMock, eventServiceMock, loggerMock as Logger);
      const service = 'file-service';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, service },
        query: {},
        body: {
          url: '/add-service/core',
        },
      } as unknown as Request;
      const res = {
        sendStatus: jest.fn(),
        json: jest.fn(),
      };
      const next = jest.fn();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service:v2', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.update.mockResolvedValueOnce({
        name: 'platform',
        services: [{ service: 'file-service', host: '/add-service/core' }],
      });
      await handler(req, res as unknown as Response, next);
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
    });

    it('Modify has error', async () => {
      const handler = updateService(repositoryMock, eventServiceMock, loggerMock as Logger);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          service: 'test-service',
          host: '/add-service/core',
        },
      } as unknown as Request;
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      };
      const next = jest.fn();
      const testDirectory = {
        name: 'platform',
        services: [
          { service: 'test-service:v2', host: '/test/service/v2' },
          { service: 'file-service', host: '/file/service' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(testDirectory);
      repositoryMock.update.mockResolvedValueOnce({
        name: 'platform',
        services: [{ service: 'test-service', host: '/add-service/core' }],
      });
      await handler(req, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    });
    it('updateService can call next with not found', async () => {
      const handler = updateService(repositoryMock, eventServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('updateApi', () => {
    it('can create handler', () => {
      const handler = updateApi(repositoryMock, eventServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });

    it('updateApi can call next with not found', async () => {
      const handler = updateApi(repositoryMock, eventServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('deleteService', () => {
    it('can create handler', () => {
      const handler = deleteService(repositoryMock, eventServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });

    it('deleteService can call next with not found', async () => {
      const handler = deleteService(repositoryMock, eventServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };
      const service = 'file-service';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, service },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('deleteApi', () => {
    it('can create handler', () => {
      const handler = deleteApi(repositoryMock, eventServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });

    it('deleteApi can call next with not found', async () => {
      const handler = deleteApi(repositoryMock, eventServiceMock, loggerMock as Logger);
      const testDirectory = {
        name: 'platform',
        services: null,
      };
      const service = 'file-service';
      const api = 'v2';
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, service, api },
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
