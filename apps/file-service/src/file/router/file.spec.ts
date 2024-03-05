import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { Mock, It } from 'moq.ts';
import { downloadFile, getFiles, uploadFile } from '.';
import { FileEntity, FileTypeEntity } from '..';
import { FileType, ServiceUserRoles } from '../types';
import { createFileRouter, deleteFile, getFile, getType, getTypes, getTypeOnRequest } from './file';

describe('file router', () => {
  const serviceId = adspId`urn:ads:platform:file-service`;
  const apiId = adspId`${serviceId}:v1`;
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

  const publicFileType: FileType & { typeId: string } = {
    tenantId,
    id: 'generated-pdf',
    name: 'Test',
    anonymousRead: true,
    readRoles: ['test-reader'],
    updateRoles: ['test-updater'],
    typeId: 'generated-pdf',
  };
  const fileType: FileType & { typeId: string } = {
    tenantId,
    id: 'generated-pdf',
    name: 'Test',
    anonymousRead: false,
    readRoles: ['test-reader'],
    updateRoles: ['test-updater'],
    typeId: 'generated-pdf',
    securityClassification: 'protected a',
  };
  const fileTypeWithoutTypeId: FileType = {
    tenantId,
    id: 'test',
    name: 'Test',
    anonymousRead: false,
    readRoles: ['test-reader'],
    updateRoles: ['test-updater'],
  };
  // const fileTypeWithRules: FileType & { typeId: string } = {
  //   tenantId,
  //   id: 'generated-pdf',
  //   name: 'Test',
  //   anonymousRead: false,
  //   readRoles: ['test-reader'],
  //   updateRoles: ['test-updater'],
  //   typeId: 'generated-pdf',
  //   rules: { retention: { deleteInDays: 42, createdAt: new Date().toString(), active: true } },
  // };

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
    securityClassification: 'protected a',
  });

  const publicFile = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(publicFileType), {
    tenantId,
    id: 'test',
    filename: 'test.txt',
    recordId: 'test-123',
    deleted: false,
    scanned: true,
    size: 123,
    created: new Date(),
    createdBy: { id: 'tester', name: 'Tester' },
    securityClassification: 'protected a',
  });
  const fileWithoutTenant = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
    tenantId: null,
    id: 'test',
    filename: 'test.txt',
    recordId: 'test-123',
    deleted: false,
    scanned: true,
    size: 123,
    created: new Date(),
    createdBy: { id: 'tester', name: 'Tester' },
    securityClassification: 'protected a',
  });
  const fileWithoutTypeId = new FileEntity(
    storageProviderMock,
    fileRepositoryMock,
    new FileTypeEntity(fileTypeWithoutTypeId),
    {
      tenantId,
      id: 'test',
      filename: 'test.txt',
      recordId: 'test-123',
      deleted: false,
      scanned: true,
      size: 123,
      created: new Date(),
      createdBy: { id: 'tester', name: 'Tester' },
      securityClassification: 'protected a',
    }
  );
  const fileVideo = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
    tenantId,
    id: 'test',
    filename: 'test.txt',
    recordId: 'test-123',
    deleted: false,
    scanned: true,
    size: 123,
    created: new Date(),
    createdBy: { id: 'tester', name: 'Tester' },
    securityClassification: 'protected a',
    mimeType: 'video/mp4',
  });
  const fileImage = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
    tenantId,
    id: 'test',
    filename: 'test.txt',
    recordId: 'test-123',
    deleted: false,
    scanned: true,
    size: 123,
    created: new Date(),
    createdBy: { id: 'tester', name: 'Tester' },
    securityClassification: 'protected a',
    mimeType: 'image/svg+xml',
  });
  const fileWithoutSecurityClassification = new FileEntity(
    storageProviderMock,
    fileRepositoryMock,
    new FileTypeEntity(fileType),
    {
      tenantId,
      id: 'test',
      filename: 'test.txt',
      recordId: 'test-123',
      deleted: false,
      scanned: true,
      size: 123,
      created: new Date(),
      createdBy: { id: 'tester', name: 'Tester' },
    }
  );
  const fileWithoutSecurityClassificationOrType = new FileEntity(storageProviderMock, fileRepositoryMock, null, {
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
      serviceId,
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
        user: { tenantId, id: 'test', roles: ['test-reader'] },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const configuration = { test: new FileTypeEntity(fileType) };
      req.getConfiguration.mockResolvedValueOnce(configuration);
      await getTypes(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'generated-pdf', name: 'Test' })])
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
        user: { tenantId, id: 'test', roles: ['test-reader'] },
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const configuration = { test: new FileTypeEntity(fileType) };
      req.getConfiguration.mockResolvedValueOnce(configuration);

      const handler = getType(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'generated-pdf', name: 'Test' }));
    });
    it('can not get type because of access problems', async () => {
      const req = {
        user: { tenantId, id: 'test', roles: ['test-reader'] },
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const fileTypeEntityMock = new Mock<FileTypeEntity>(fileType);
      fileTypeEntityMock.setup((m) => m.canAccess(It.IsAny())).returns(false);
      const configuration = { test: fileTypeEntityMock.object() };

      // const configuration = { test: new FileTypeEntity(fileType) };
      req.getConfiguration.mockResolvedValueOnce(configuration);

      const handler = getType(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        new UnauthorizedError('User undefined (ID: test) not permitted to Access file type.')
      );
    });

    // it('can get type with empty file type', async () => {
    //   const req = {
    //     user: { tenantId, id: 'test', roles: ['test-reader'] },
    //     getConfiguration: jest.fn(),
    //     params: { fileTypeId: 'test' },
    //   };
    //   const res = {
    //     send: jest.fn(),
    //   };
    //   const next = jest.fn();

    //   const configuration = { test: new FileTypeEntity(null) };
    //   req.getConfiguration.mockResolvedValueOnce(configuration);

    //   const handler = getType(loggerMock);
    //   await handler(req as unknown as Request, res as unknown as Response, next);
    //   expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'generated-pdf', name: 'Test' }));
    // });

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
      req.getConfiguration.mockResolvedValueOnce(configuration);

      const handler = getType(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
  describe('getTypeOnRequest', () => {
    it('can create handler', () => {
      const handler = getTypeOnRequest(loggerMock);
      expect(handler).toBeTruthy();
    });

    it('can get type on request', async () => {
      const req = {
        user: { tenantId, id: 'test', roles: ['test-reader'] },
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
        fileEntity: file,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const fileTypeEntityMock = new Mock<FileTypeEntity>(fileType);
      fileTypeEntityMock.setup((m) => m.canAccess(It.IsAny())).returns(true);
      const configuration = { 'generated-pdf': fileTypeEntityMock.object() };
      req.getConfiguration.mockResolvedValueOnce(configuration);

      // const fileHandler = getFile(fileRepositoryMock);
      // await fileHandler(req as unknown as Request, res as unknown as Response, next);
      const handler = getTypeOnRequest(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      // expect(req.fileTypeEntity).toEqual(fileType);

      expect(req['fileEntity']).toMatchObject({ id: 'test' });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('throws error because typeId not found', async () => {
      const req = {
        user: { tenantId, id: 'test', roles: ['test-reader'] },
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
        fileEntity: fileWithoutTypeId,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const configuration = { 'generated-pdf': fileType };
      req.getConfiguration.mockResolvedValueOnce(configuration);

      // const fileHandler = getFile(fileRepositoryMock);
      // await fileHandler(req as unknown as Request, res as unknown as Response, next);
      const handler = getTypeOnRequest(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      // expect(req.fileTypeEntity).toEqual(fileType);

      // expect(req['fileEntity']).toMatchObject({ id: 'test' });
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      // expect(() => entity.requireConstantRole(null)).toThrowError(UnauthorizedUserError);
      // expect(next).toHaveBeenCalledTimes(1);
    });

    it('can not get file type on request when unauthorized', async () => {
      const req = {
        user: { tenantId, id: 'test', roles: ['test-reader'] },
        getConfiguration: jest.fn(),
        params: { fileTypeId: 'test' },
        fileEntity: file,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const fileTypeEntityMock = new Mock<FileTypeEntity>(fileType);
      fileTypeEntityMock.setup((m) => m.canAccess(It.IsAny())).returns(false);
      const configuration = { 'generated-pdf': fileTypeEntityMock.object() };
      req.getConfiguration.mockResolvedValueOnce(configuration);

      // const fileHandler = getFile(fileRepositoryMock);
      // await fileHandler(req as unknown as Request, res as unknown as Response, next);
      const handler = getTypeOnRequest(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      // expect(req.fileTypeEntity).toEqual(fileType);
      //expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(next).toHaveBeenCalledWith(
        new UnauthorizedError('User undefined (ID: test) not permitted to Access file type.')
      );
      // expect(req['fileEntity']).toMatchObject({ id: 'test' });
      // expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFiles', () => {
    it('can create handler', () => {
      const handler = getFiles(apiId, fileRepositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get files', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceUserRoles.Admin],
        },
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
        query: { top: '43', criteria: JSON.stringify({ lastAccessedBefore: new Date().toString() }) },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const page = {};
      fileRepositoryMock.find.mockResolvedValueOnce({ results: [file], page });

      const handler = getFiles(apiId, fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });
    // it('can get files with certain criteria', async () => {
    //   const req = {
    //     user: {
    //       tenantId,
    //       id: 'test',
    //       roles: [ServiceUserRoles.Admin],
    //     },
    //     tenant: {
    //       id: tenantId,
    //     },
    //     getConfiguration: jest.fn(),
    //     query: { top: '43', criteria: JSON.stringify({ lastAccessedBefore: new Date().toString() }) },
    //   };
    //   const res = {
    //     send: jest.fn(),
    //   };
    //   const next = jest.fn();

    //   const page = {};
    //   fileRepositoryMock.find.mockResolvedValueOnce({ results: [file], page });

    //   const handler = getFiles(apiId, fileRepositoryMock);
    //   await handler(req as unknown as Request, res as unknown as Response, next);
    //   expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    // });
    it('can get files without security classification', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceUserRoles.Admin],
        },
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const page = {};
      fileRepositoryMock.find.mockResolvedValueOnce({ results: [fileWithoutSecurityClassification], page });

      const handler = getFiles(apiId, fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });
    it('can get files without security classification or type', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: [ServiceUserRoles.Admin],
        },
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const page = {};
      fileRepositoryMock.find.mockResolvedValueOnce({ results: [fileWithoutSecurityClassificationOrType], page });

      const handler = getFiles(apiId, fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page }));
    });

    it('can throw for no tenant', async () => {
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

      const handler = getFiles(apiId, fileRepositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toBeCalledWith(expect.any(InvalidOperationError));
      expect(res.send).not.toBeCalled();
    });
  });

  describe('uploadFile', () => {
    it('can create handler', () => {
      const handler = uploadFile(apiId, loggerMock, eventServiceMock);
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
        fileTypeEntity: new FileTypeEntity(fileType),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = uploadFile(apiId, loggerMock, eventServiceMock);
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

      const handler = uploadFile(apiId, loggerMock, eventServiceMock);
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
        fileEntity: file,
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
        FileEntity: file,
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
        setHeader: jest.fn(),
        status: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(file);

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });
    it('can download file that is public', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: { embed: 'true' },
        fileEntity: publicFile,
      };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(publicFile);

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public');
    });

    it('can download image file', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: fileImage,
      };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(fileImage);

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });
    it('can download file video', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: fileVideo,
      };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(fileVideo);

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });

    it('can embed file', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test',
          roles: ['test-reader'],
        },
        getConfiguration: jest.fn(),
        query: {
          embed: 'true',
        },
        fileEntity: file,
      };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(file);

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', "inline; filename*=UTF-8''test.txt");
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
          securityClassification: 'Public',
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

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
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
          securityClassification: 'Public',
          deleted: false,
          scanned: false,
          size: 123,
          created: new Date(),
          createdBy: { id: 'tester', name: 'Tester' },
        }),
      };
      const res = {
        status: jest.fn(),
        setHeader: jest.fn(),
      };
      const next = jest.fn();

      const stream = { pipe: jest.fn() };
      storageProviderMock.readFile.mockResolvedValueOnce(stream);
      fileRepositoryMock.get.mockResolvedValueOnce(file);

      const handler = downloadFile(loggerMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalled();
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
          id: 'tester',
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
    it('can delete file without tenant', async () => {
      const req = {
        user: {
          tenantId,
          id: 'tester',
          roles: ['test-updater'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: fileWithoutTenant,
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

    it('fails to delete file and throws error', async () => {
      const req = {
        user: {
          tenantId,
          id: 'tester',
          roles: ['test-updater'],
        },
        getConfiguration: jest.fn(),
        query: {},
        fileEntity: { markForDeletion: jest.fn().mockRejectedValue(new Error('Some error')) },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteFile(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(new Error('Some error'));
    });
  });
});
