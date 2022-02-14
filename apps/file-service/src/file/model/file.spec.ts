import { adspId, User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, InvalidOperationError } from '@core-services/core-common';
import { Mock, It } from 'moq.ts';
import { Readable } from 'stream';
import { FileRepository } from '../repository';
import { FileRecord, ServiceUserRoles } from '../types';
import { FileEntity } from './file';
import { FileTypeEntity } from './type';
import { FileStorageProvider } from '../storage';

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

  let storageProviderMock: Mock<FileStorageProvider> = null;
  let repositoryMock: Mock<FileRepository> = null;
  let typeMock: Mock<FileTypeEntity> = null;
  let contentMock: Mock<Readable>;

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
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    const fileEntity = await FileEntity.create(
      storageProviderMock.object(),
      repositoryMock.object(),
      user,
      typeMock.object(),
      file,
      contentMock.object()
    );

    expect(fileEntity).toBeTruthy();
  });

  it('can create new and delete on storage failure', async () => {
    typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
    storageProviderMock.setup((m) => m.saveFile(It.IsAny(), contentMock.object())).returns(Promise.resolve(false));
    storageProviderMock.setup((m) => m.deleteFile(It.IsAny())).returns(Promise.resolve(true));
    repositoryMock.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
    repositoryMock.setup((m) => m.delete(It.IsAny())).returns(Promise.resolve(true));

    const file = {
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    await expect(
      FileEntity.create(
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
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
    };

    try {
      await FileEntity.create(
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
      };

      entity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), typeMock.object(), file);

      typeMock.setup((m) => m.canUpdateFile(user)).returns(true);
      storageProviderMock.setup((m) => m.saveFile(entity, contentMock.object())).returns(Promise.resolve(true));
      repositoryMock.setup((m) => m.save(entity)).returns(Promise.resolve(entity));
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

    it('can check user update for user with updated on type', () => {
      typeMock.setup((m) => m.canUpdateFile(user)).returns(true);

      const canAccess = entity.canUpdate(user);
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

    it('can default user update to admin if type missing', () => {
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

      const canUpdate = entity.canUpdate(user);
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
      storageProviderMock.setup((m) => m.readFile(entity)).returns(Promise.resolve(contentMock.object()));
      repositoryMock.setup((m) => m.save(entity)).returns(Promise.resolve(entity));

      entity.readFile(user).then((result) => {
        expect(result).toBe(contentMock.object());
        expect(entity.lastAccessed >= start).toBeTruthy();
        done();
      });
    });

    it('can throw for file marked for deletion', async () => {
      typeMock.setup((m) => m.canAccessFile(user)).returns(true);

      await entity.markForDeletion(user);
      await expect(entity.readFile(user)).rejects.toThrowError(InvalidOperationError);
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
      entity.markForDeletion(user).then((result) => {
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
      repositoryMock.setup((m) => m.save(entity)).returns(Promise.resolve(entity));

      entity.updateScanResult(true).then((result) => {
        expect(result.scanned).toBeTruthy();
        expect(result.infected).toBeTruthy();
        done();
      });
    });
  });
});
