import { adspId, User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { Logger } from 'winston';
import {
  AnonymousAuditActor,
  FileDeletedAuditAction,
  FileDownloadedAuditAction,
  FileUnsafeDownloadedAuditAction,
  FileUploadedAuditAction,
} from '../audit';
import { FileEntity, FileTypeEntity } from '../model';
import { FileType } from '../types';
import { deleteFile, deleteFiles, downloadFile, fileOperation, uploadFile } from './file';

jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn() }));

describe('file router audit', () => {
  const serviceId = adspId`urn:ads:platform:file-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const storageProviderMock = {
    readFile: jest.fn(),
    saveFile: jest.fn(),
    copyFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const fileRepositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const eventServiceMock = { send: jest.fn() };
  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };

  const fileType: FileType = {
    tenantId,
    id: 'supporting-documents',
    name: 'Supporting documents',
    anonymousRead: false,
    readRoles: ['test-reader'],
    updateRoles: ['test-updater'],
  };

  const user = {
    tenantId,
    id: 'tester',
    name: 'Tester',
    email: 'tester@test.co',
    roles: ['test-reader', 'test-updater'],
  } as User;

  const createFile = (values: Partial<{ scanned: boolean; anonymousRead: boolean; recordId: string }> = {}) =>
    new FileEntity(
      storageProviderMock,
      fileRepositoryMock,
      new FileTypeEntity({ ...fileType, anonymousRead: !!values.anonymousRead }),
      {
        tenantId,
        id: 'file-1',
        filename: 'proof-of-identity.pdf',
        recordId: 'recordId' in values ? values.recordId : 'application-123',
        deleted: false,
        scanned: values.scanned ?? true,
        size: 100,
        created: new Date(),
        createdBy: { id: 'tester', name: 'Tester' },
      },
    );

  const downloadRequest = (fileEntity: FileEntity, query: Record<string, string> = {}, currentUser: User = user) => ({
    user: currentUser,
    query,
    fileEntity,
    range: jest.fn(() => undefined),
  });
  const downloadResponse = () => ({ setHeader: jest.fn(), status: jest.fn() });

  beforeEach(() => {
    jest.clearAllMocks();
    fileRepositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    storageProviderMock.readFile.mockImplementation(() => Promise.resolve(Readable.from(['test value'])));
  });

  describe('uploadFile', () => {
    it('records file uploaded with the file metadata', () => {
      const fileEntity = createFile({ scanned: false });
      const req = { user, fileEntity };
      const res = { send: jest.fn() };
      const next = jest.fn();

      uploadFile(
        apiId,
        loggerMock,
        eventServiceMock,
        auditServiceMock,
      )(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      // Scan is still pending, but the upload is recorded.
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(FileUploadedAuditAction, {
        tenantId,
        actor: { id: 'tester', type: 'user', name: 'Tester', email: 'tester@test.co', roles: user.roles },
        resource: { type: 'file', id: 'file-1', name: 'proof-of-identity.pdf' },
        correlationId: 'application-123',
        metadata: {
          filename: 'proof-of-identity.pdf',
          type: 'supporting-documents',
          recordId: 'application-123',
          size: 100,
        },
      });
    });

    it('records file uploaded without correlation for a file without a record ID', () => {
      const fileEntity = createFile({ recordId: undefined });
      const req = { user, fileEntity };
      const res = { send: jest.fn() };

      uploadFile(
        apiId,
        loggerMock,
        eventServiceMock,
        auditServiceMock,
      )(req as unknown as Request, res as unknown as Response, jest.fn());

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileUploadedAuditAction,
        expect.objectContaining({
          correlationId: undefined,
          metadata: expect.objectContaining({ recordId: null }),
        }),
      );
    });
  });

  describe('downloadFile', () => {
    it('records file downloaded for a safe download', async () => {
      const fileEntity = createFile();
      const next = jest.fn();

      await downloadFile(loggerMock, auditServiceMock)(
        downloadRequest(fileEntity) as unknown as Request,
        downloadResponse() as unknown as Response,
        next,
      );

      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileDownloadedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: 'tester', type: 'user' }),
          resource: { type: 'file', id: 'file-1', name: 'proof-of-identity.pdf' },
          metadata: expect.objectContaining({ filename: 'proof-of-identity.pdf', recordId: 'application-123' }),
        }),
      );
    });

    it('records file downloaded and not unsafe download for unsafe=true on a scanned file', async () => {
      await downloadFile(loggerMock, auditServiceMock)(
        downloadRequest(createFile(), { unsafe: 'true' }) as unknown as Request,
        downloadResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(FileDownloadedAuditAction, expect.any(Object));
      expect(auditServiceMock.record).not.toHaveBeenCalledWith(FileUnsafeDownloadedAuditAction, expect.any(Object));
    });

    it('records unsafe download for unsafe=true before the scan completes', async () => {
      await downloadFile(loggerMock, auditServiceMock)(
        downloadRequest(createFile({ scanned: false }), { unsafe: 'true' }) as unknown as Request,
        downloadResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileUnsafeDownloadedAuditAction,
        expect.objectContaining({ resource: expect.objectContaining({ id: 'file-1' }) }),
      );
      expect(FileUnsafeDownloadedAuditAction).toMatchObject({ severity: 'warning', retentionClass: 'security' });
    });

    it('records anonymous download with the anonymous actor', async () => {
      await downloadFile(loggerMock, auditServiceMock)(
        downloadRequest(createFile({ anonymousRead: true }), {}, null) as unknown as Request,
        downloadResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileDownloadedAuditAction,
        expect.objectContaining({ actor: AnonymousAuditActor }),
      );
    });

    it('records the range of a partial download', async () => {
      const req = downloadRequest(createFile());
      req.range.mockReturnValueOnce(Object.assign([{ start: 0, end: 9 }], { type: 'bytes' }));

      await downloadFile(loggerMock, auditServiceMock)(
        req as unknown as Request,
        downloadResponse() as unknown as Response,
        jest.fn(),
      );

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileDownloadedAuditAction,
        expect.objectContaining({ metadata: expect.objectContaining({ range: { start: 0, end: 9 } }) }),
      );
    });

    it('does not record download when scan is pending and unsafe is not specified', async () => {
      const next = jest.fn();
      await downloadFile(loggerMock, auditServiceMock)(
        downloadRequest(createFile({ scanned: false })) as unknown as Request,
        downloadResponse() as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('does not record download when the user is not allowed to read the file', async () => {
      const next = jest.fn();
      const otherUser = { tenantId, id: 'other', name: 'Other', roles: [] } as User;
      await downloadFile(loggerMock, auditServiceMock)(
        downloadRequest(createFile(), {}, otherUser) as unknown as Request,
        downloadResponse() as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('records file deleted', async () => {
      const req = { user, fileEntity: createFile() };
      const res = { send: jest.fn() };
      const next = jest.fn();

      await deleteFile(
        apiId,
        loggerMock,
        eventServiceMock,
        auditServiceMock,
      )(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileDeletedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: 'tester' }),
          resource: { type: 'file', id: 'file-1', name: 'proof-of-identity.pdf' },
        }),
      );
    });

    it('does not record file deleted when the user is not allowed to delete', async () => {
      const req = { user: { tenantId, id: 'other', name: 'Other', roles: [] }, fileEntity: createFile() };
      const res = { send: jest.fn() };
      const next = jest.fn();

      await deleteFile(
        apiId,
        loggerMock,
        eventServiceMock,
        auditServiceMock,
      )(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('records file deleted for each file of a bulk delete', async () => {
      fileRepositoryMock.get.mockImplementation((id: string) => Promise.resolve(Object.assign(createFile(), { id })));
      const req = { user, query: { files: 'file-1,file-2' } };
      const res = { send: jest.fn() };

      await deleteFiles(
        apiId,
        loggerMock,
        eventServiceMock,
        auditServiceMock,
        fileRepositoryMock,
      )(req as unknown as Request, res as unknown as Response, jest.fn());

      expect(auditServiceMock.record).toHaveBeenCalledTimes(2);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileDeletedAuditAction,
        expect.objectContaining({ resource: expect.objectContaining({ id: 'file-2' }) }),
      );
    });
  });

  describe('fileOperation', () => {
    it('records file uploaded for a copy with the source file', async () => {
      storageProviderMock.copyFile.mockResolvedValueOnce(true);
      const req = { user, fileEntity: createFile(), body: { operation: 'copy', filename: 'copy.pdf' } };
      const res = { send: jest.fn() };
      const next = jest.fn();

      await fileOperation(
        apiId,
        loggerMock,
        eventServiceMock,
        auditServiceMock,
      )(req as unknown as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileUploadedAuditAction,
        expect.objectContaining({
          resource: expect.objectContaining({ type: 'file', name: 'copy.pdf' }),
          metadata: expect.objectContaining({ filename: 'copy.pdf', sourceFileId: 'file-1' }),
        }),
      );
    });
  });
});
