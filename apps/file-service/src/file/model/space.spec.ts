import { Mock, It } from 'moq.ts';
import { adspId, User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, InvalidOperationError } from '@core-services/core-common';
import { FileSpace, ServiceUserRoles } from '../types';
import { FileSpaceRepository } from '../repository';
import { FileTypeEntity } from './type';
import { FileSpaceEntity } from './space';

jest.mock('mkdirp', () => jest.fn(() => Promise.resolve()));

describe('File Space Entity', () => {
  const user: User = {
    id: 'user-2',
    name: 'testy',
    email: 'test@testco.org',
    roles: [ServiceUserRoles.Admin],
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    isCore: false,
    token: null
  };

  const space: FileSpace = {
    id: 'test',
    name: 'Test',
    spaceAdminRole: 'test-admin',
    types: {
      a: {
        id: 'a',
        name: 'Type A',
        anonymousRead: false,
        readRoles: [],
        updateRoles: [],
        spaceId: '123',
      },
    },
  };

  const storagePath = 'files';

  let repositoryMock: Mock<FileSpaceRepository> = null;

  beforeEach(() => {
    repositoryMock = new Mock<FileSpaceRepository>();
    repositoryMock.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
  });

  it('can be initialized', () => {
    const entity = new FileSpaceEntity(repositoryMock.object(), space);

    expect(entity).toBeTruthy();
    expect(entity.id).toEqual(space.id);
    expect(entity.name).toEqual(space.name);
    expect(entity.spaceAdminRole).toEqual(entity.spaceAdminRole);
    expect(entity.types['a']).toBeInstanceOf(FileTypeEntity);
  });

  it.skip('can create new', (done) => {
    FileSpaceEntity.create(user, repositoryMock.object(), space).then((entity) => {
      expect(entity).toBeTruthy();
      done();
    });
  });

  it('can prevent unauthorized create new', () => {
    function createFileSpaceEntity() {
      return FileSpaceEntity.create(
        {
          ...user,
          roles: [],
        },
        repositoryMock.object(),
        space
      );
    }
    expect(() => {
      createFileSpaceEntity();
    }).toThrow(/User testy \(ID: user-2\) not permitted to create file space/);
  });

  describe('instance', () => {
    let entity: FileSpaceEntity = null;
    beforeEach(() => {
      entity = new FileSpaceEntity(repositoryMock.object(), space);
    });

    it('can get path', () => {
      const path = entity.getPath(storagePath);
      expect(path).toEqual(`${storagePath}/${entity.id}`);
    });

    it('can update', (done) => {
      const update = {
        name: 'new-name',
        spaceAdminRole: 'new-admin',
      };

      entity.update(user, update).then((result) => {
        expect(result.name).toEqual(update.name);
        expect(result.spaceAdminRole).toEqual(update.spaceAdminRole);
        done();
      });
    });

    it('can prevent unauthorized user update', async () => {
      function update(entity) {
        return entity.update(
          {
            ...user,
            roles: [],
          },
          {
            name: 'new-name',
          }
        );
      }
      await expect(update(entity)).rejects.toThrow(/User not authorized to updated space./);
    });

    it('can check access for user with file service admin role', () => {
      const canAccess = entity.canAccess(user);
      expect(canAccess).toBeTruthy();
    });

    it('can check access for user with space admin role', () => {
      const canAccess = entity.canAccess({
        ...user,
        roles: ['test-admin'],
      });
      expect(canAccess).toBeTruthy();
    });

    it('can check access for user without role', () => {
      const canAccess = entity.canAccess({
        ...user,
        roles: [],
      });
      expect(canAccess).toBeFalsy();
    });

    it('can check access for null user', () => {
      const canAccess = entity.canAccess(null);
      expect(canAccess).toBeFalsy();
    });

    it('can check update for user with file service admin role', () => {
      const canUpdate = entity.canUpdate(user);
      expect(canUpdate).toBeTruthy();
    });

    it('can check update for user with space admin role', () => {
      const canUpdate = entity.canUpdate({
        ...user,
        roles: ['test-admin'],
      });
      expect(canUpdate).toBeTruthy();
    });

    it('can check update for user without role', () => {
      const canUpdate = entity.canUpdate({
        ...user,
        roles: [],
      });
      expect(canUpdate).toBeFalsy();
    });

    it('can check update for null user', () => {
      const canUpdate = entity.canUpdate(null);
      expect(canUpdate).toBeFalsy();
    });

    it('can add type', async (done) => {
      await entity.addType(user, storagePath, 'test', {
        name: 'test',
        anonymousRead: false,
        readRoles: [],
        updateRoles: [],
        spaceId: 'space1234',
      });

      const type = entity.types['test'];
      expect(type).toBeTruthy();
      // TODO: need to double check the expect
      // expect(mkdirpMock.mock.calls[0][0]).toEqual(`${storagePath}/${entity.id}/test`);
      done();
    });

    describe('auth types', () => {
      beforeEach(() => {
        jest.setTimeout(18000);
      });

      it('can prevent unauthorized add type', async () => {
        function addType(entity) {
          return entity.addType(
            {
              ...user,
              roles: [],
            },
            storagePath,
            'test',
            {
              name: 'test',
              anonymousRead: false,
              readRoles: [],
              updateRoles: [],
              spaceId: 'space1234',
            }
          );
        }

        try {
          await addType(entity);
        } catch (e) {
          expect(e).toEqual(new UnauthorizedError('User not authorized to create type.'));
        }
      });
    });

    it('can prevent add existing type', async () => {
      function addType(entity) {
        return entity.addType(user, storagePath, 'a', {
          name: 'a',
          anonymousRead: false,
          readRoles: [],
          updateRoles: [],
          spaceId: 'space1234',
        });
      }
      try {
        await addType(entity);
      } catch (e) {
        expect(e).toEqual(new InvalidOperationError("Type with ID 'a' already exists."));
      }
    });

    it('can prevent add type with invalid id', async () => {
      function addType(entity) {
        return entity.addType(user, storagePath, '../a', {
          name: '../a',
          anonymousRead: false,
          readRoles: [],
          updateRoles: [],
          spaceId: 'space1234',
        });
      }

      try {
        await addType(entity);
      } catch (e) {
        expect(e).toEqual(new InvalidOperationError("Type ID '../a' is not valid."));
      }
    });

    it('can update type', (done) => {
      const update = {
        anonymousRead: true,
      };
      entity.updateType(user, 'a', update).then((result) => {
        expect(result.types['a'].anonymousRead).toEqual(update.anonymousRead);
        done();
      });
    });
  });
});
