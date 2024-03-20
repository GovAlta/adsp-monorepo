import { fileUploaded, fileDeleted } from './events';
import { adspId, User } from '@abgov/adsp-service-sdk';
import { FileEntity } from './model';
import { FileType } from './types';
import { FileTypeEntity } from './model';
import { File } from './types';

describe('Events', () => {
  const serviceId = adspId`urn:ads:platform:file-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = {
    id: 'testUserId',
    name: 'Test User',
  } as User;

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

  const fileWithRecordId = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
    id: 'testFileId',
    recordId: 'testRecordId',
    filename: 'testFilename.txt',
    size: 1024,
    createdBy: user,
    created: new Date(),
  });

  const fileWithoutRecordId = new FileEntity(storageProviderMock, fileRepositoryMock, new FileTypeEntity(fileType), {
    id: 'testFileIdWithoutRecordId',
    filename: 'testFilename2.txt',
    size: 2048,
    createdBy: user,
    created: new Date(),
    recordId: null,
  });

  describe('FileUpload', () => {
    it('should return DomainEvent with file.recordId', () => {
      const domainEvent = fileUploaded(tenantId, user, fileWithRecordId);
      expect(domainEvent.name).toBe('file-uploaded');
      expect((domainEvent.payload.file as File).filename).toBe(fileWithRecordId.filename);
      expect(domainEvent.correlationId).toBe(fileWithRecordId.recordId);
    });

    it('should return DomainEvent without file.recordId', () => {
      const domainEvent = fileUploaded(tenantId, user, fileWithoutRecordId);
      expect(domainEvent.name).toBe('file-uploaded');
      expect((domainEvent.payload.file as File).filename).toBe(fileWithoutRecordId.filename);
      expect((domainEvent.payload.file as File).id).toBe(fileWithoutRecordId.id);
    });
  });
  describe('FileDelete', () => {
    it('should return DomainEvent with file.recordId', () => {
      const domainEvent = fileDeleted(apiId, user, fileWithRecordId);
      expect(domainEvent.name).toBe('file-deleted');
      expect((domainEvent.payload.file as File).filename).toBe(fileWithRecordId.filename);
      expect(domainEvent.correlationId).toBe(fileWithRecordId.recordId);
    });

    it('should return DomainEvent without file.recordId', () => {
      const domainEvent = fileDeleted(apiId, user, fileWithoutRecordId);
      expect(domainEvent.name).toBe('file-deleted');
      expect((domainEvent.payload.file as File).filename).toBe(fileWithoutRecordId.filename);
      expect((domainEvent.payload.file as File).id).toBe(fileWithoutRecordId.id);
    });
  });
});
