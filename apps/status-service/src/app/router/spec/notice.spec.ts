import { getNotices, getNoticeById, deleteNotice, createNotice, updateNotice, createNoticeRouter } from '../notice';
import { Request } from 'express';
import { NoticeApplicationEntity } from '../../model';
import {
  loggerMock,
  tenantServiceMock,
  applicationsMock,
  nextMock,
  eventServiceMock,
  resMock,
  tenantId,
  noticeRepositoryMock,
  statusNoticeMock,
  findApplicationsResponseMock,
  updateNoticePayloadMock,
} from './mock';

describe('Notice service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
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
