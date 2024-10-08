import { adspId, User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, InvalidOperationError } from '@core-services/core-common';
import { Mock, It } from 'moq.ts';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { FileRecord, ServiceUserRoles } from '../types';
import { FileEntity } from './file';
import { FileTypeEntity } from './type';
import { FileStorageProvider } from '../storage';

let contentMock: Mock<Readable>;

jest.mock('../../utils/fileTypeDetector', () => ({
  FileTypeDetector: jest.fn().mockImplementation(() => ({
    detect: jest.fn().mockResolvedValue({
      fileType: { mime: 'image/jpeg' },
      fileStream: contentMock.object(),
    }),
  })),
}));

describe('File Entity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user: User = {
    id: 'user-2',
    name: 'testy',
    email: 'test@testco.org',
    roles: ['test-admin'],
    tenantId,
    isCore: false,
    token: null,
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown;

  let storageProviderMock: Mock<FileStorageProvider> = null;
  let repositoryMock: Mock<FileRepository> = null;
  let typeMock: Mock<FileTypeEntity> = null;

  beforeEach(() => {
    storageProviderMock = new Mock<FileStorageProvider>();
    repositoryMock = new Mock<FileRepository>();
    typeMock = new Mock<FileTypeEntity>();
    contentMock = new Mock<Readable>();
  });

  it('can be initialized for new record', () => {
    const file = {
      filename: 'test.txt',
      recordId: 'my-record-1',
      securityClassification: 'Public',
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    const entity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), typeMock.object(), file);

    expect(entity).toBeTruthy();
    expect(entity.id).toBeTruthy();
    expect(entity.filename).toEqual(file.filename);
    expect(entity.recordId).toEqual(file.recordId);
    expect(entity.created).toEqual(file.created);
    expect(entity.createdBy).toEqual(file.createdBy);
    expect(entity.scanned).toBeFalsy();
    expect(entity.deleted).toBeFalsy();
  });

  it('can be initialized for existing record', () => {
    const file: FileRecord = {
      tenantId,
      id: 'file-1',
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
      scanned: false,
      deleted: true,
      infected: false,
      digest: '',
    };

    const entity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), typeMock.object(), file);

    expect(entity).toBeTruthy();
    expect(entity.id).toEqual(file.id);
    expect(entity.filename).toEqual(file.filename);
    expect(entity.recordId).toEqual(file.recordId);
    expect(entity.size).toEqual(file.size);
    expect(entity.created).toEqual(file.created);
    expect(entity.createdBy).toEqual(file.createdBy);
    expect(entity.scanned).toEqual(false);
    expect(entity.deleted).toEqual(true);
  });

  it('can create new', async () => {
    typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
    storageProviderMock.setup((m) => m.saveFile(It.IsAny(), contentMock.object())).returns(Promise.resolve(true));
    repositoryMock.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));

    const file = {
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      securityClassification: 'Public',
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    const fileEntity = await FileEntity.create(
      loggerMock as Logger,
      storageProviderMock.object(),
      repositoryMock.object(),
      user,
      typeMock.object(),
      file,
      contentMock.object()
    );

    expect(fileEntity).toBeTruthy();
  });
  it('can not create because save failed', async () => {
    typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
    storageProviderMock.setup((m) => m.saveFile(It.IsAny(), contentMock.object())).returns(Promise.resolve(false));
    repositoryMock
      .setup((m) => m.save(It.IsAny()))
      .callback(async (i) => {
        const savedEntity = i.args[0];
        savedEntity.delete = jest.fn().mockResolvedValue(true);
        return savedEntity;
      });

    const file = {
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      securityClassification: 'Public',
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };
    expect(async () => {
      await FileEntity.create(
        loggerMock as Logger,
        storageProviderMock.object(),
        repositoryMock.object(),
        user,
        typeMock.object(),
        file,
        contentMock.object()
      );
    }).rejects.toThrowError('Storage provider failed to save uploaded file: test.txt');
  });

  it('can create new and delete on storage failure', async () => {
    typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
    storageProviderMock.setup((m) => m.saveFile(It.IsAny(), contentMock.object())).returns(Promise.resolve(false));
    storageProviderMock.setup((m) => m.deleteFile(It.IsAny())).returns(Promise.resolve(true));
    repositoryMock.setup((m) => m.save(It.IsAny(), It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
    repositoryMock.setup((m) => m.delete(It.IsAny())).returns(Promise.resolve(true));

    const file = {
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      securityClassification: 'Public',
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    await expect(
      FileEntity.create(
        loggerMock as Logger,
        storageProviderMock.object(),
        repositoryMock.object(),
        user,
        typeMock.object(),
        file,
        contentMock.object()
      )
    ).rejects.toThrowError(Error);
  });

  it('can prevent unauthorized user create new', async () => {
    typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(false);

    const file = {
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      created: new Date(),
      securityClassification: 'Public',
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    try {
      await FileEntity.create(
        loggerMock as Logger,
        storageProviderMock.object(),
        repositoryMock.object(),
        user,
        typeMock.object(),
        file,
        contentMock.object()
      );
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedError);
    }
  });

  describe('instance', () => {
    let entity: FileEntity = null;
    beforeEach(() => {
      const file: FileRecord = {
        tenantId,
        id: 'file-1',
        filename: 'test.txt',
        recordId: 'my-record-1',
        size: 100,
        created: new Date(),
        createdBy: {
          id: 'user-1',
          name: 'testy',
        },
        scanned: false,
        deleted: false,
        infected: false,
        digest: '',
      };

      entity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), typeMock.object(), file);

      typeMock.setup((m) => m.canUpdateFile(user)).returns(true);
      storageProviderMock.setup((m) => m.saveFile(entity, contentMock.object())).returns(Promise.resolve(true));
      repositoryMock.setup((m) => m.save(It.IsAny(), It.IsAny())).returns(Promise.resolve(entity));
    });

    it('can check user access for user with access to type', () => {
      typeMock.setup((m) => m.canAccessFile(user)).returns(true);

      const canAccess = entity.canAccess(user);
      expect(canAccess).toBeTruthy();
    });

    it('can check user access for user without access to type', () => {
      typeMock.setup((m) => m.canAccessFile(user)).returns(false);

      const canAccess = entity.canAccess(user);
      expect(canAccess).toBeFalsy();
    });

    it('can check user delete for other user with update role on type', () => {
      typeMock.setup((m) => m.canUpdateFile(user)).returns(true);

      const canAccess = entity.canDelete(user);
      expect(canAccess).toBeFalsy();
    });

    it('can check user delete for original creator user with update role on type', () => {
      const creator = { ...user, id: 'user-1' };
      typeMock.setup((m) => m.canUpdateFile(creator)).returns(true);

      const canAccess = entity.canDelete(creator);
      expect(canAccess).toBeTruthy();
    });

    it('can default user access to admin if type missing', () => {
      entity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), null, {
        tenantId,
        id: 'file-1',
        filename: 'test.txt',
        recordId: 'my-record-1',
        size: 100,
        created: new Date(),
        createdBy: {
          id: 'user-1',
          name: 'testy',
        },
        scanned: false,
        deleted: false,
        infected: false,
      });

      const canAccess = entity.canAccess(user);
      expect(canAccess).toBeFalsy();

      const canAdminAccess = entity.canAccess({
        id: 'user-2',
        name: 'testy',
        email: 'test@testco.org',
        roles: [ServiceUserRoles.Admin],
        tenantId,
        isCore: false,
        token: null,
      });
      expect(canAdminAccess).toBeTruthy();
    });

    it('can default user delete to admin if type missing', () => {
      entity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), null, {
        tenantId,
        id: 'file-1',
        filename: 'test.txt',
        recordId: 'my-record-1',
        size: 100,
        created: new Date(),
        securityClassification: 'protected a',
        createdBy: {
          id: 'user-1',
          name: 'testy',
        },
        scanned: false,
        deleted: false,
        infected: false,
      });

      const canUpdate = entity.canDelete(user);
      expect(canUpdate).toBeFalsy();

      const canAdminUpdate = entity.canAccess({
        id: 'user-2',
        name: 'testy',
        email: 'test@testco.org',
        roles: [ServiceUserRoles.Admin],
        tenantId,
        isCore: false,
        token: null,
      });
      expect(canAdminUpdate).toBeTruthy();
    });

    it('can read file', (done) => {
      const start = new Date();
      typeMock.setup((m) => m.canAccessFile(user)).returns(true);
      storageProviderMock
        .setup((m) => m.readFile(entity, 0, entity.size - 1))
        .returns(Promise.resolve(contentMock.object()));
      repositoryMock.setup((m) => m.save(It.IsAny(), It.IsAny())).returns(Promise.resolve(entity));

      entity.readFile(user).then((result) => {
        expect(result).toBe(contentMock.object());
        expect(entity.lastAccessed >= start).toBeTruthy();
        done();
      });
    });

    it('can read file with range', (done) => {
      const start = new Date();
      typeMock.setup((m) => m.canAccessFile(user)).returns(true);
      storageProviderMock.setup((m) => m.readFile(entity, 12, 100)).returns(Promise.resolve(contentMock.object()));
      repositoryMock.setup((m) => m.save(It.IsAny(), It.IsAny())).returns(Promise.resolve(entity));

      entity.readFile(user, 12, 100).then((result) => {
        expect(result).toBe(contentMock.object());
        expect(entity.lastAccessed >= start).toBeTruthy();
        done();
      });
    });

    it('can throw for file marked for deletion', async () => {
      const admin = { ...user, roles: [ServiceUserRoles.Admin] };
      typeMock.setup((m) => m.canAccessFile(admin)).returns(true);

      await entity.markForDeletion(admin);
      await expect(entity.readFile(admin)).rejects.toThrowError(InvalidOperationError);
    });

    it('can throw for infected file', async () => {
      typeMock.setup((m) => m.canAccessFile(user)).returns(true);

      await entity.updateScanResult(true);
      expect(entity.readFile(user)).rejects.toThrowError(InvalidOperationError);
    });

    it('can throw on read by unauthorized', async () => {
      typeMock.setup((m) => m.canAccessFile(user)).returns(true);
      expect(entity.readFile(null)).rejects.toThrowError(UnauthorizedError);
    });

    it('can mark for delete', (done) => {
      const admin = { ...user, roles: [ServiceUserRoles.Admin] };
      entity.markForDeletion(admin).then((result) => {
        expect(result.deleted).toEqual(true);
        done();
      });
    });

    it('can set size', (done) => {
      entity.setSize(101).then((entity) => {
        expect(entity.size).toBe(101);
        done();
      });
    });

    it('can prevent unauthorized user from marking file for delete', () => {
      typeMock.setup((m) => m.canUpdateFile(user)).returns(false);

      expect(() => {
        entity.markForDeletion(user);
      }).toThrowError(UnauthorizedError);
    });

    it('can delete', (done) => {
      storageProviderMock.setup((m) => m.deleteFile(entity)).returns(Promise.resolve(true));
      repositoryMock.setup((m) => m.delete(entity)).returns(Promise.resolve(true));

      entity.deleted = true;
      entity.delete().then((deleted) => {
        expect(deleted).toBeTruthy();

        done();
      });
    });

    it('can prevent delete of file not marked for deletion', async () => {
      entity.deleted = false;
      await expect(entity.delete()).rejects.toThrowError(InvalidOperationError);
    });

    it('can throw on delete for storage failure', async () => {
      storageProviderMock.setup((m) => m.deleteFile(entity)).returns(Promise.resolve(false));
      repositoryMock.setup((m) => m.delete(entity)).returns(Promise.resolve(true));

      entity.deleted = true;
      await expect(entity.delete()).rejects.toThrowError(Error);
    });

    it('can update scan result', (done) => {
      entity.updateScanResult(false).then((result) => {
        expect(result.scanned).toBeTruthy();
        expect(result.deleted).toBeFalsy();
        done();
      });
    });

    it('can update scan result as infected', (done) => {
      repositoryMock.setup((m) => m.save(It.IsAny(), It.IsAny())).returns(Promise.resolve(entity));

      entity.updateScanResult(true).then((result) => {
        expect(result.scanned).toBeTruthy();
        expect(result.infected).toBeTruthy();
        done();
      });
    });

    it('can copy', async () => {
      repositoryMock.setup((m) => m.save(It.IsAny())).callback(({ args: [entity] }) => entity);
      storageProviderMock.setup((m) => m.copyFile(It.IsAny(), It.IsAny())).returns(Promise.resolve(true));

      const typeMock = new Mock<FileTypeEntity>();
      typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
      typeMock.setup((m) => m.id).returns('new-type');
      typeMock.setup((m) => m.securityClassification).returns('protected b');

      const copy = await entity.copy(user);
      expect(copy.id).not.toBe(entity.id);
      expect(copy.filename).toBe(entity.filename);
      expect(copy.type).toBe(entity.type);
    });

    it('can copy with filename, type, and recordId', async () => {
      repositoryMock.setup((m) => m.save(It.IsAny())).callback(({ args: [entity] }) => entity);
      storageProviderMock.setup((m) => m.copyFile(It.IsAny(), It.IsAny())).returns(Promise.resolve(true));

      const typeMock = new Mock<FileTypeEntity>();
      typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
      typeMock.setup((m) => m.id).returns('new-type');
      typeMock.setup((m) => m.securityClassification).returns('protected b');

      const filename = 'copy';
      const type = typeMock.object();
      const recordId = 'copy parent';
      const copy = await entity.copy(user, filename, type, recordId);
      expect(copy.id).not.toBe(entity.id);
      expect(copy.filename).toBe(filename);
      expect(copy.type).toBe(type);
      expect(copy.recordId).toBe(recordId);
      expect(copy.securityClassification).toBe('protected b');
    });

    it('can copy and delete on storage provider failure', async () => {
      repositoryMock.setup((m) => m.save(It.IsAny())).returns(Promise.resolve(entity));
      repositoryMock.setup((m) => m.delete(It.IsAny())).returns(Promise.resolve(true));

      storageProviderMock.setup((m) => m.copyFile(It.IsAny(), It.IsAny())).returns(Promise.resolve(false));
      // Storage provider returns true for delete even if the file doesn't exist.
      storageProviderMock.setup((m) => m.deleteFile(It.IsAny())).returns(Promise.resolve(true));

      const typeMock = new Mock<FileTypeEntity>();
      typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
      typeMock.setup((m) => m.id).returns('new-type');
      typeMock.setup((m) => m.securityClassification).returns('protected b');

      const filename = 'copy';
      const type = typeMock.object();
      await expect(entity.copy(user, filename, type)).rejects.toThrowError();
      repositoryMock.verify((m) => m.delete(It.IsAny()));
    });

    it('can copy and fail for unauthorized user', async () => {
      const typeMock = new Mock<FileTypeEntity>();
      typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(false);

      const filename = 'copy';
      const type = typeMock.object();
      await expect(entity.copy(user, filename, type)).rejects.toThrowError(UnauthorizedError);
    });
  });
});
