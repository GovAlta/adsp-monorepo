import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidValueError, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { DirectoryEntity } from '../model';
import { DirectoryRepository } from '../repository';
import { ServiceRoles } from '../roles';
import {
  createDirectoryRouter,
  getDirectoriesByNamespace,
  getEntriesForService,
  getDirectoryEntryForApi,
  createNamespace,
  addService,
  addServiceApi,
  updateService,
  updateApi,
  deleteService,
  deleteApi,
  getServiceData,
  resolveNamespaceTenant,
  validateNamespaceEndpointsPermission,
  deleteEntry,
  getEntriesForServiceImpl,
} from './directory';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  }));
});
describe('router', () => {
  const namespace = 'platform';
  const name = 'test-service';
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

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
    getTags: jest.fn(),
    getTaggedResources: jest.fn(),
    applyTag: jest.fn(),
    removeTag: jest.fn(),
    saveResource: jest.fn(),
    deleteResource: jest.fn(),
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
  describe('deleteEntry', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      repositoryMock.getDirectories.mockClear();
    });

    it('should throw an error if the namespace is not found', async () => {
      const namespace = 'testNamespace';
      const entry = 'testService';

      repositoryMock.getDirectories.mockResolvedValueOnce(null);

      await expect(deleteEntry(namespace, entry, repositoryMock)).rejects.toThrow(
        new InvalidValueError('Delete namespace service', `Cannot find namespace: ${namespace}`)
      );
    });
    it('should throw an error if the entry is not found', async () => {
      const namespace = 'testNamespace';
      const entry = 'testService';
      const directoryEntity = { services: [] };

      repositoryMock.getDirectories.mockResolvedValueOnce(directoryEntity);

      await expect(deleteEntry(namespace, entry, repositoryMock)).rejects.toThrow(
        new InvalidValueError('Delete namespace service', `Cannot find ${entry}`)
      );
    });
    it('should delete the entry and return it on success', async () => {
      const namespace = 'testNamespace';
      const entry = 'testService';
      const serviceToDelete = { service: entry, host: 'http://localhost' };
      const directoryEntity = { services: [serviceToDelete] };

      repositoryMock.getDirectories.mockResolvedValueOnce(directoryEntity);
      repositoryMock.update.mockResolvedValue(undefined);

      const result = await deleteEntry(namespace, entry, repositoryMock);

      expect(result).toEqual(serviceToDelete);
      expect(repositoryMock.update).toHaveBeenCalledWith({
        name: namespace,
        services: [],
      });
    });
  });

  describe('create directory router', () => {
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
      send: jest.fn(),
    };

    it('can create handler', () => {
      expect(handler).toBeTruthy();
    });
    it('can get directories by namespace', async () => {
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
    it('can return not found', async () => {
      const next = jest.fn();

      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith([]);
    });
    it('should call next(err) on error', async () => {
      const error = new Error('Test error');
      const next = jest.fn();
      repositoryMock.getDirectories.mockRejectedValue(error);

      await handler(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getEntriesForService', () => {
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
    const testServiceRes = {
      service: {
        namespace: 'platform',
        service: 'test-service',
        url: '/test/service',
        urn: 'urn:ads:platform:test-service',
      },
    };
    it('can create handler', () => {
      expect(handler).toBeTruthy();
    });
    it('can get entries by namespace and service', async () => {
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(testServiceRes));
    });
    it('getEntriesForService can return not found', async () => {
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
        sendStatus: jest.fn(),
      };
      const next = jest.fn();
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.NOT_FOUND);
    });
    it('should call next(err) on error', async () => {
      const error = new Error('Test error');
      const next = jest.fn();
      repositoryMock.getDirectories.mockRejectedValue(error);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  describe('getEntriesForService Implementation', () => {
    const repositoryMock = {
      getDirectories: jest.fn(),
    };

    it('can find a service with no APIs', async () => {
      const directory = {
        services: [
          {
            _id: '3',
            namespace: 'test-namespace',
            service: 'test-service',
            host: 'http://test/service',
          },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getEntriesForServiceImpl(
        directory.services[0].namespace,
        directory.services[0].service,
        repository
      );
      expect(results.service).toEqual({
        namespace: directory.services[0].namespace,
        service: directory.services[0].service,
        url: directory.services[0].host,
        urn: 'urn:ads:test-namespace:test-service',
      });
      expect(results.apis).toEqual([]);
    });

    it('can find a service with APIs', async () => {
      const directory = {
        services: [
          { _id: '4', namespace: 'test-namespace', service: 'test-service', host: 'http://service' },
          { _id: '5', namespace: 'test-namespace', service: 'test-service:apiA', host: 'http://api1' },
          { _id: '6', namespace: 'test-namespace', service: 'test-service:apiB', host: 'http://api2' },
          { _id: '7', namespace: 'test-namespace', service: 'test-service:apiC', host: 'http://api3' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getEntriesForServiceImpl(directory.services[0].namespace, 'test-service', repository);
      expect(results.service).toEqual({
        namespace: 'test-namespace',
        service: 'test-service',
        url: 'http://service',
        urn: 'urn:ads:test-namespace:test-service',
      });
      expect(results.apis).toEqual(
        expect.arrayContaining([
          {
            namespace: 'test-namespace',
            service: 'test-service:apiA',
            url: 'http://api1',
            urn: 'urn:ads:test-namespace:test-service:apiA',
          },
          {
            namespace: 'test-namespace',
            service: 'test-service:apiB',
            url: 'http://api2',
            urn: 'urn:ads:test-namespace:test-service:apiB',
          },
          {
            namespace: 'test-namespace',
            service: 'test-service:apiC',
            url: 'http://api3',
            urn: 'urn:ads:test-namespace:test-service:apiC',
          },
        ])
      );
    });

    it('can find APIs but no service', async () => {
      const directory = {
        services: [
          { _id: '5', namespace: 'test-namespace', service: 'test-service:apiA', host: 'http://api1' },
          { _id: '6', namespace: 'test-namespace', service: 'test-service:apiB', host: 'http://api2' },
          { _id: '7', namespace: 'test-namespace', service: 'test-service:apiC', host: 'http://api3' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getEntriesForServiceImpl(directory.services[0].namespace, 'test-service', repository);

      expect(results.service).toEqual(null);
      expect(results.apis).toEqual(
        expect.arrayContaining([
          {
            namespace: 'test-namespace',
            service: 'test-service:apiA',
            url: 'http://api1',
            urn: 'urn:ads:test-namespace:test-service:apiA',
          },
          {
            namespace: 'test-namespace',
            service: 'test-service:apiB',
            url: 'http://api2',
            urn: 'urn:ads:test-namespace:test-service:apiB',
          },
          {
            namespace: 'test-namespace',
            service: 'test-service:apiC',
            url: 'http://api3',
            urn: 'urn:ads:test-namespace:test-service:apiC',
          },
        ])
      );
    });

    it('cant find anything', async () => {
      const directory = {
        services: [
          { _id: '5', namespace: 'test-namespace', service: 'test-service:apiA', host: 'http://api1' },
          { _id: '6', namespace: 'test-namespace', service: 'test-service:apiB', host: 'http://api2' },
          { _id: '7', namespace: 'test-namespace', service: 'test-service:apiC', host: 'http://api3' },
        ],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getEntriesForServiceImpl(directory.services[0].namespace, 'bob', repository);

      expect(results).toEqual(null);
    });
  });

  describe('getDirectoryEntryForApi', () => {
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
    const next = jest.fn();
    it('can create handler', () => {
      expect(handler).toBeTruthy();
    });
    it('can get entries by namespace , service and api', async () => {
      const testServiceRes = {
        namespace: 'platform',
        service: 'test-service:v2',
        url: '/test/service/v2',
        urn: 'urn:ads:platform:test-service:v2',
      };

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
    it('getDirectoryEntryForApi will return with not found', async () => {
      const testDirectory = {
        name: 'platform',
        services: null,
      };

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace, name, api },
        query: {},
      } as unknown as Request;
      const res = {
        json: jest.fn(),
        sendStatus: jest.fn(),
      };

      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      await handler(req, res as unknown as Response, next);
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.NOT_FOUND);
    });
    it('should call next(err) on error', async () => {
      const error = new Error('Test error');

      repositoryMock.getDirectories.mockRejectedValue(error);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  describe('getServiceData', () => {
    const handler = getServiceData(repositoryMock, loggerMock as Logger);

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
    it('can create handler', () => {
      expect(handler).toBeTruthy();
    });
    it('can get service metadata by service', async () => {
      const entity = new DirectoryEntity(repositoryMock, testDirectory);
      repositoryMock.getDirectories.mockResolvedValueOnce(entity);
      axiosMock.get.mockResolvedValueOnce({ data: metadata });

      await handler(req, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining(response));
    });

    it('should return BAD_REQUEST if directory entity is not found', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(null);
      const res = {
        sendStatus: jest.fn(),
        json: jest.fn(),
      };

      const handler = getServiceData(repositoryMock, loggerMock as Logger);
      await handler(req, res as unknown as Response, next);
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    });

    it('should throw an error if service is not found in directory', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce({ services: [] });
      const handler = getServiceData(repositoryMock, loggerMock as Logger);
      await handler(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalled();
    });
    it('should handle metadata fetch error', async () => {
      const entity = new DirectoryEntity(repositoryMock, testDirectory);

      repositoryMock.getDirectories.mockResolvedValueOnce(entity);

      axiosMock.get.mockResolvedValueOnce(new Error('Fetch error'));

      const handler = getServiceData(repositoryMock, loggerMock as Logger);
      await handler(req, res as unknown as Response, next);

      expect(loggerMock.warn).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('createNamespace', () => {
    it('can create handler', () => {
      const handler = createNamespace(repositoryMock, tenantServiceMock, loggerMock as Logger);
      expect(handler).toBeTruthy();
    });

    it('can create namespace by post', async () => {
      const handler = createNamespace(repositoryMock, tenantServiceMock, loggerMock as Logger);
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

    it('createNamespace can call next with invalid operation', async () => {
      const handler = createNamespace(repositoryMock, tenantServiceMock, loggerMock as Logger);
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
      expect(next).toHaveBeenCalledWith(expect.any(InvalidValueError));
    });

    it('createNamespace can call next with unauthorized', async () => {
      const handler = createNamespace(repositoryMock, tenantServiceMock, loggerMock as Logger);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [], tenantId } as User,
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

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('addService', () => {
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
    it('can create handler', () => {
      expect(handler).toBeTruthy();
    });
    it('can add service by post', async () => {
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
      const testDirectory = {
        name: 'platform',
        services: null,
      };
      const res = {
        json: jest.fn(),
      };

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

  describe('resolveNamespaceTenant', () => {
    it('can create handler', () => {
      const handler = resolveNamespaceTenant(loggerMock as Logger, tenantServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can get tenant by name', async () => {
      const req = {
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace: 'test-tenant' },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const tenant = { id: tenantId };
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);
      const handler = resolveNamespaceTenant(loggerMock as Logger, tenantServiceMock);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.tenant).toBe(tenant);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('test tenant');
    });

    it('can call next with not found if no tenant', async () => {
      const req = {
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace: 'test-tenant' },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);
      const handler = resolveNamespaceTenant(loggerMock as Logger, tenantServiceMock);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with get tenant error.', async () => {
      const req = {
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        params: { namespace: 'test-tenant' },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const error = new Error('oh noes!');
      tenantServiceMock.getTenantByName.mockRejectedValueOnce(error);
      const handler = resolveNamespaceTenant(loggerMock as Logger, tenantServiceMock);
      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateNamespaceEndpointsPermission', () => {
    it('can pass for user of tenant with role', () => {
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ServiceRoles.DirectoryAdmin], tenantId } as User,
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      validateNamespaceEndpointsPermission(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with unauthorized for user without role', () => {
      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [], tenantId } as User,
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      validateNamespaceEndpointsPermission(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with unauthorized for user of wrong tenant.', () => {
      const req = {
        tenant: { id: tenantId },
        user: {
          isCore: false,
          roles: [ServiceRoles.DirectoryAdmin],
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        } as User,
        query: {},
        body: {
          namespace: namespace,
        },
      } as unknown as Request;
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();
      validateNamespaceEndpointsPermission(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
