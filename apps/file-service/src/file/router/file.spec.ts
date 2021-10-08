import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { downloadFile, getFiles, uploadFile } from '.';
import { FileEntity, FileTypeEntity } from '..';
import { FileType, ServiceUserRoles } from '../types';
import { createFileRouter, deleteFile, getFile, getType, getTypes } from './file';

describe('file router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const storageProviderMock = {
    readFile: jest.fn(),
    saveFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const fileRepositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileType: FileType = {
    tenantId,
    id: 'test',
    name: 'Test',
    anonymousRead: false,
    readRoles: ['test-reader'],
    updateRoles: ['test-updater'],
  };

  const file = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
    tenantId,
    id: 'test',
    filename: 'test.txt',
    recordId: 'test-123',
    deleted: false,
    scanned: true,
    size: 123,
    created: new Date(),
    createdBy: { id: 'tester', name: 'Tester' },
  });

  beforeEach(() => {
    storageProviderMock.readFile.mockReset();
    storageProviderMock.saveFile.mockReset();
    storageProviderMock.deleteFile.mockReset();

    fileRepositoryMock.find.mockReset();
    fileRepositoryMock.get.mockReset();
    fileRepositoryMock.save.mockReset();
    fileRepositoryMock.delete.mockReset();
  });

  it('can create router', () => {
    const router = createFileRouter({
      logger: loggerMock,
      storageProvider: storageProviderMock,
      fileRepository: fileRepositoryMock,
      eventService: eventServiceMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getTypes', () => {
    it('can get types', async () => {
      const req = {
        user: { tenantId, id: 'test', roles: [ServiceUserRoles.Admin] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const configuration = { test: new FileTypeEntity(fileType) };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      await getTypes(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'test', name: 'Test' })])
      );
    });
  });

  describe('getType', () => {
    it('can create handler', () => {
      const handler = getType(loggerMock);
      expect(handler).toBeTruthy();
    });

    it('can get type', async () => {
      const req = {
        user: { tenantId, id: 'test', roles: [ServiceUserRoles.Admin] },
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const configuration = { test: new FileTypeEntity(fileType) };
      req.getConfiguration.mockResolvedValueOnce([configuration]);

      const handler = getType(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test', name: 'Test' }));
    });

    it('can call next with not found', async () => {
      const req = {
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const configuration = {};
      req.getConfiguration.mockResolvedValueOnce([configuration]);

      const handler = getType(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getFiles', () => {
    it('can create handler', () => {
      const handler = getFiles(fileRepositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get files', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceUserRoles.Admin],
        },
        getConfiguration: jest.fn(),
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const page = {};
      fileRepositoryMock.find.mockResolvedValueOnce({ results: [], page });

      const handler = getFiles(fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });
  });

  describe('uploadFile', () => {
    it('can create handler', () => {
      const handler = uploadFile(loggerMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can return uploaded file information', () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceUserRoles.Admin],
        },
        fileEntity: file,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = uploadFile(loggerMock, eventServiceMock);
      handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: file.id, filename: file.filename }));
    });

    it('can call next with invalid for no file.', () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceUserRoles.Admin],
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = uploadFile(loggerMock, eventServiceMock);
      handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getFile', () => {
    it('can create handler', () => {
      const handler = getFile(fileRepositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get file', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        params: { fileId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      fileRepositoryMock.get.mockResolvedValueOnce(file);

      const handler = getFile(fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(req['fileEntity']).toMatchObject({ id: file.id, filename: file.filename });
    });

    it('can call next with not found.', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        params: { fileId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      fileRepositoryMock.get.mockResolvedValueOnce(null);

      const handler = getFile(fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with unauthorized.', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [],
        },
        getConfiguration: jest.fn(),
        params: { fileId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      fileRepositoryMock.get.mockResolvedValueOnce(file);

      const handler = getFile(fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('downloadFile', () => {
    it('can download file', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: file,
      };
      const res = {
        writeHead: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(file);

      await downloadFile(req as unknown as Request, res as unknown as Response, next);
      expect(res.writeHead).toHaveBeenCalledWith(200, null, expect.anything());
      expect(stream.pipe).toHaveBeenCalled();
    });

    it('can call next with invalid for not scanned', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
          tenantId,
          id: 'test',
          filename: 'test.txt',
          recordId: 'test-123',
          deleted: false,
          scanned: false,
          size: 123,
          created: new Date(),
          createdBy: { id: 'tester', name: 'Tester' },
        }),
      };
      const res = {
        writeHead: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(file);

      await downloadFile(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can unsafe download not scanned', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: { unsafe: 'true' },
        fileEntity: new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
          tenantId,
          id: 'test',
          filename: 'test.txt',
          recordId: 'test-123',
          deleted: false,
          scanned: false,
          size: 123,
          created: new Date(),
          createdBy: { id: 'tester', name: 'Tester' },
        }),
      };
      const res = {
        writeHead: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(file);

      await downloadFile(req as unknown as Request, res as unknown as Response, next);
      expect(res.writeHead).toHaveBeenCalledWith(200, null, expect.anything());
      expect(stream.pipe).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('can create handler', () => {
      const handler = deleteFile(loggerMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete file', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: file,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      fileRepositoryMock.save.mockResolvedValueOnce(file);

      const handler = deleteFile(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
    });
  });
});
