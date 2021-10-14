import { adspId, User } from '@abgov/adsp-service-sdk';
import { FileTypeEntity } from './type';
import { FileType } from '../types';

describe('File Type Entity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const type: FileType = {
    tenantId,
    id: 'type-1',
    name: 'Type 1',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
  };

  const user: User = {
    id: 'user-2',
    name: 'testy',
    email: 'test@testco.org',
    roles: ['test-admin'],
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    isCore: false,
    token: null,
  };

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
      tenantId,
      type.id,
      type.name,
      type.anonymousRead,
      type.readRoles,
      type.updateRoles
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
  });
});
