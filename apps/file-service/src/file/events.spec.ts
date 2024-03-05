import { fileUploaded, fileDeleted } from './events';
import { adspId, User } from '@abgov/adsp-service-sdk';

describe('Events', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = {
    id: 'testUserId',
    name: 'Test User',
  } as User;
  const fileWithRecordId = {
    id: 'testFileId',
    recordId: 'testRecordId',
    filename: 'testFilename.txt',
    size: 1024,
    createdBy: user,
    created: new Date(),
  };
  const fileWithoutRecordId = {
    id: 'testFileIdWithoutRecordId',
    filename: 'testFilename2.txt',
    size: 2048,
    createdBy: user,
    created: new Date(),
    recordId: null,
  };

  describe('FileUpload', () => {
    it('should return DomainEvent with file.recordId', () => {
      const domainEvent = fileUploaded(tenantId, user, fileWithRecordId);
      expect(domainEvent.name).toBe('file-uploaded');
      expect(domainEvent.tenantId).toBe(tenantId);
      expect(domainEvent.payload.file).toBe(fileWithRecordId);

      expect(domainEvent.correlationId).toBe(fileWithRecordId.recordId);
    });

    it('should return DomainEvent without file.recordId', () => {
      const domainEvent = fileUploaded(tenantId, user, fileWithoutRecordId);
      expect(domainEvent.name).toBe('file-uploaded');
      expect(domainEvent.tenantId).toBe(tenantId);
      expect(domainEvent.payload.file).toBe(fileWithoutRecordId);

      expect(domainEvent.correlationId).toBe(fileWithoutRecordId.id);
    });
  });
  describe('FileDelete', () => {
    it('should return DomainEvent with file.recordId', () => {
      const domainEvent = fileDeleted(user, fileWithRecordId);
      expect(domainEvent.name).toBe('file-deleted');
      expect(domainEvent.tenantId).toBe(user.tenantId);
      expect(domainEvent.payload.file).toBe(fileWithRecordId);
      expect(domainEvent.correlationId).toBe(fileWithRecordId.recordId);
    });

    it('should return DomainEvent without file.recordId', () => {
      const domainEvent = fileDeleted(user, fileWithoutRecordId);
      expect(domainEvent.name).toBe('file-deleted');
      expect(domainEvent.tenantId).toBe(user.tenantId);
      expect(domainEvent.payload.file).toBe(fileWithoutRecordId);

      expect(domainEvent.correlationId).toBe(fileWithoutRecordId.id);
    });
  });
});
