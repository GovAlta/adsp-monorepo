import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request } from 'express';
import { FileEntity, FileTypeEntity } from '../model';
import { FileType } from '../types';
import { FileStorageEngine } from './upload';

describe('upload', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
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

  it('can be created', () => {
    const engine = new FileStorageEngine(fileRepositoryMock, storageProviderMock);
    expect(engine).toBeTruthy();
  });

  describe('handleFile', () => {
    const engine = new FileStorageEngine(fileRepositoryMock, storageProviderMock);
    it('can handle file.', async () => {
      const req = {
        getConfiguration: jest.fn(),
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        query: {},
        body: { type: 'test' },
      };
      const multerFile = {};
      const cb = jest.fn();

      const configuration = { test: new FileTypeEntity(fileType) };
      req.getConfiguration.mockResolvedValueOnce([configuration]);
      storageProviderMock.saveFile.mockResolvedValueOnce(true);
      fileRepositoryMock.save.mockResolvedValueOnce(file);

      await engine._handleFile(req as unknown as Request, multerFile as Express.Multer.File, cb);
      expect(req['fileEntity']).toBe(file);
      expect(cb).toHaveBeenCalled();
    });

    it('can call cb with not found.', async () => {
      const req = {
        getConfiguration: jest.fn(),
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        query: {},
        body: { type: 'test' },
      };
      const multerFile = {};
      const cb = jest.fn();

      const configuration = {};
      req.getConfiguration.mockResolvedValueOnce([configuration]);

      await engine._handleFile(req as unknown as Request, multerFile as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call cb with invalid for no type.', async () => {
      const req = {
        getConfiguration: jest.fn(),
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        query: {},
        body: {},
      };
      const multerFile = {};
      const cb = jest.fn();

      await engine._handleFile(req as unknown as Request, multerFile as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call cb with invalid for invalid filename.', async () => {
      const req = {
        getConfiguration: jest.fn(),
        user: {
          tenantId,
          id: 'test',
          roles: ['test-updater'],
        },
        query: {},
        body: { type: 'test', filename: '/343/.exe' },
      };
      const multerFile = {};
      const cb = jest.fn();

      await engine._handleFile(req as unknown as Request, multerFile as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('removeFile', () => {
    const engine = new FileStorageEngine(fileRepositoryMock, storageProviderMock);
    it('can remove file', async () => {
      const req = {
        fileEntity: file,
      };
      const multerFile = {};
      const cb = jest.fn();

      storageProviderMock.deleteFile.mockResolvedValueOnce(true);
      fileRepositoryMock.delete.mockResolvedValueOnce(true);
      await engine._removeFile(req as unknown as Request, multerFile as Express.Multer.File, cb);
      expect(cb).toHaveBeenCalledWith(null);
    });
  });
});
