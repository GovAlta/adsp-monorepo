import { Mock } from 'moq.ts';
import { User, UnauthorizedError } from '@core-services/core-common';
import { FileSpaceEntity } from './space';
import { FileTypeEntity } from './type';
import { FileType } from '../types';

describe('File Type Entity', () => {
  const type: FileType = {
    id: 'type-1',
    name: 'Type 1',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };

  const user: User = {
    id: 'user-2',
    name: 'testy',
    email: 'test@testco.org',
    roles: ['test-admin'],
  };

  let spaceMock: Mock<FileSpaceEntity>;

  beforeEach(() => {
    spaceMock = new Mock<FileSpaceEntity>();
    spaceMock.setup((m) => m.canUpdate(user)).returns(true);
  });

  it('can be initialized', () => {
    const entity = new FileTypeEntity(type);

    expect(entity).toBeTruthy();
    expect(entity.id).toEqual(type.id);
    expect(entity.name).toEqual(type.name);
    expect(entity.anonymousRead).toEqual(type.anonymousRead);
    expect(entity.readRoles).toEqual(type.readRoles);
    expect(entity.updateRoles).toEqual(type.updateRoles);
  });

  it('can create new', () => {
    const entity = FileTypeEntity.create(
      type.id,
      type.name,
      type.anonymousRead,
      type.readRoles,
      type.updateRoles,
      type.spaceId
    );

    expect(entity).toBeTruthy();
  });

  describe('instance', () => {
    let entity: FileTypeEntity = null;

    beforeEach(() => {
      entity = new FileTypeEntity(type);
    });

    it('can check access for user with read role', () => {
      const canAccess = entity.canAccessFile(user);
      expect(canAccess).toBeTruthy();
    });

    it('can check access for user without read role', () => {
      const canAccess = entity.canAccessFile({
        ...user,
        roles: [],
      });
      expect(canAccess).toBeFalsy();
    });

    it('can check access for null user', () => {
      const canAccess = entity.canAccessFile(null);
      expect(canAccess).toBeFalsy();
    });

    it('can check access for anonymous read', () => {
      entity.anonymousRead = true;
      const canAccess = entity.canAccessFile(null);
      expect(canAccess).toBeTruthy();
    });

    it('can check update for user with update role', () => {
      const canUpdate = entity.canUpdateFile(user);
      expect(canUpdate).toBeTruthy();
    });

    it('can check update for user without update role', () => {
      const canUpdate = entity.canUpdateFile({
        ...user,
        roles: [],
      });
      expect(canUpdate).toBeFalsy();
    });

    it('can update', () => {
      const update = {
        name: 'new-name',
        anonymousRead: true,
        readRoles: ['updated-role'],
        updateRoles: ['updated-role'],
      };

      entity.update(user, update);
      expect(entity.name).toEqual(update.name);
      expect(entity.anonymousRead).toEqual(update.anonymousRead);
      expect(entity.readRoles).toEqual(update.readRoles);
      expect(entity.updateRoles).toEqual(update.updateRoles);
    });

    it('can prevent unauthorized user update', async () => {
      function update(entity) {
        return entity.update(
          {
            ...user,
            roles: [],
          },
          { anonymousRead: true }
        );
      }
      try {
        await update(entity);
      } catch (e) {
        expect(e).toEqual(new UnauthorizedError('User not authorized to update type.'));
      }
    });
  });
});
