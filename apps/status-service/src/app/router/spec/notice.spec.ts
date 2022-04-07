import { getNotices, getNoticeById, deleteNotice, createNotice, updateNotice, createNoticeRouter } from '../notice';
import { Request, Response } from 'express';
import { NoticeApplicationEntity } from '../../model';
import { Logger } from 'winston';
import { adspId } from '@abgov/adsp-service-sdk';
describe('Notice service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantServiceMock = {
    getTenants: jest.fn(() => Promise.resolve([{ id: tenantId, name: 'test-mock', realm: 'test' }])),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const nextMock = jest.fn();

  const applicationsMock = [
    {
      repository: {},
      _id: '620ae946ddd181001195caad',
      endpoint: { status: 'online', url: 'https://www.yahoo.com' },
      metadata: '',
      name: 'MyApp 1',
      description: 'MyApp',
      statusTimestamp: 1648247257463,
      tenantId: tenantId.toString(),
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      status: 'operational',
      enabled: true,
      internalStatus: 'healthy',
    },
    {
      repository: {},
      _id: '624365fe3367d200110e17c5',
      endpoint: { status: 'offline', url: 'https://localhost.com' },
      metadata: '',
      name: 'test-mock',
      description: '',
      statusTimestamp: 0,
      tennantServRef: '{}',
      tenantId: tenantId.toString(),
      tenantName: 'Platform',
      tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      enabled: false,
      internalStatus: 'stopped',
      status: 'offline',
      enable: jest.fn((app) => {
        return {
          ...app,
          enabled: true,
        };
      }),

      disable: jest.fn((app) => {
        return {
          ...app,
          enabled: false,
        };
      }),
      setStatus: jest.fn(() =>
        Promise.resolve({
          name: 'status-updated-app',
          internalStatus: 'stopped',
        })
      ),
      update: jest.fn(() =>
        Promise.resolve({
          name: 'updated-app',
          internalStatus: 'stopped',
          tennantServRef: '{}',
        })
      ),
      delete: jest.fn(() => Promise.resolve()),
      canAccessById: jest.fn(() => {
        return true;
      }),
    },
  ];

  const resMock = {
    json: jest.fn(),
    sendStatus: jest.fn(),
    send: jest.fn(),
    status: jest.fn(() => {
      return {
        json: jest.fn(),
      };
    }),
  } as unknown as Response;

  const noticeRepositoryMock = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    get: jest.fn(),
  };

  const statusNoticeMock = {
    message: 'test mock',
    tennantServRef: '{}',
    startDate: '2022-04-07T16:00:00.000',
    endDate: '2022-04-07T20:00:00.000Z',
    isAllApplications: true,
  };

  const findApplicationsResponseMock = {
    page: 1,
    results: [
      {
        mode: 'active',
        tennantServRef: '{}',
      },
    ],
  };

  const updateNoticePayloadMock = {
    id: '624f4ff79d71d0001135a6f2',
    message: 'test-mock',
    tennantServRef: [
      {
        id: '624cbda156bd8200125eda68',
        name: 'mock-test',
      },
    ],
    startDate: '2022-04-07T16:00:00.000Z',
    endDate: '2022-04-07T20:00:00.000Z',
    isAllApplications: false,
  };

  describe('Can create notice router', () => {
    it('Create notice router', () => {
      const router = createNoticeRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        noticeRepository: noticeRepositoryMock,
        eventService: eventServiceMock,
      });

      expect(router).toBeTruthy();
    });
  });

  describe('Can create new notice', () => {
    it('Can create new notice', async () => {
      const handler = createNotice(loggerMock, tenantServiceMock, noticeRepositoryMock);
      const createMock = jest.fn().mockResolvedValueOnce(statusNoticeMock);
      NoticeApplicationEntity.create = createMock;

      const reqMock = {
        body: statusNoticeMock,
        user: { tenantId, id: 'test', roles: ['test-updater'] },
      } as unknown as Request;
      await handler(reqMock, resMock, nextMock);
      expect(resMock.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Can get notice', () => {
    it('Can get notices', async () => {
      noticeRepositoryMock.find.mockResolvedValueOnce(findApplicationsResponseMock);
      const handler = getNotices(loggerMock, tenantServiceMock, noticeRepositoryMock);
      const reqMock = {
        query: { top: 20, after: 0, mode: 'operation' },
        user: { tenantId, id: 'test', roles: ['status-admin'] },
      } as unknown as Request;
      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, results: [{ mode: 'published', tennantServRef: {} }] })
      );
    });

    it('Can get notice by id', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);
      const handler = getNoticeById(loggerMock, noticeRepositoryMock);
      const reqMock = {
        user: { tenantId, id: 'test', roles: ['status-admin'] },
        params: {
          id: applicationsMock[1]._id,
        },
      } as unknown as Request;

      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: applicationsMock[1]._id,
        })
      );
    });
  });
  describe('Can delete notice', () => {
    it('Can delete notice', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);

      const handler = deleteNotice(loggerMock, noticeRepositoryMock);
      const reqMock = {
        user: { tenantId, id: 'test', roles: ['status-admin'] },
        params: {
          id: applicationsMock[1]._id,
        },
      } as unknown as Request;
      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: applicationsMock[1]._id,
        })
      );
    });
  });

  describe('Can update notice', () => {
    it('Can update notice', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(applicationsMock[1]);

      const handler = updateNotice(loggerMock, eventServiceMock, noticeRepositoryMock);
      const reqMock = {
        user: { tenantId, id: 'test', roles: ['status-admin'] },
        body: updateNoticePayloadMock,
        params: {
          id: 1,
        },
      } as unknown as Request;
      await handler(reqMock, resMock, nextMock);
      expect(resMock.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'updated-app',
        })
      );
    });
  });
});
