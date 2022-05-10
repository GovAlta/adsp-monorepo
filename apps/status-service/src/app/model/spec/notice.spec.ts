import type { User } from '@abgov/adsp-service-sdk';
import { NoticeApplicationEntity } from '../notice';
import { NoticeModeType } from '../../types';
import { ServiceUserRoles } from '../../types';
import { UnauthorizedError, InvalidValueError } from '@core-services/core-common';

describe('NoticeApplicationEntity', () => {
  const repositoryMock = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    get: jest.fn(),
  };
  const entityMock = {
    id: 'mock-entity-id',
    message: 'This is a mock message',
    startDate: new Date('2022-05-09T14:00:00.000Z'),
    endDate: new Date('2022-05-09T18:00:00.000Z'),
    mode: 'draft' as NoticeModeType,
    tenantId: 'urn:ads:platform:mock-service:v2:/tenants/mock-service-id',
    isAllApplications: true,
    tenantName: 'mock-tenant',
    created: new Date(),
    tennantServRef: 'tenant-serf-ref',
  };

  const userMock = {
    roles: [ServiceUserRoles.StatusAdmin],
  } as User;

  describe('Can create notice application entity', () => {
    it('Can create notice application entity', () => {
      const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
      expect(endpointEntity).toBeTruthy();
    });
  });

  describe('Can update notice application entity', () => {
    it('Test update permission', () => {
      expect(() => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
        endpointEntity.update({ ...userMock, roles: [] }, entityMock);
      }).toThrow(UnauthorizedError);

      expect(() => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
        endpointEntity.update(userMock, { ...entityMock, mode: 'archived' as NoticeModeType });
      }).toThrow(InvalidValueError);

      expect(() => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, {
          ...entityMock,
          mode: 'archived' as NoticeModeType,
        });
        endpointEntity.update(userMock, entityMock);
      }).toThrow(InvalidValueError);
    });

    it('Can update notice application entity', () => {
      const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
      endpointEntity.update(userMock, { ...entityMock, message: 'new mock message' });
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'new mock message',
        })
      );
    });

    describe('Can delete notice application entity', () => {
      it('Can delete notice application entity', () => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
        endpointEntity.delete(userMock);
        expect(repositoryMock.delete).toHaveBeenCalledWith(
          expect.objectContaining({
            id: entityMock.id,
          })
        );
      });

      it('Test entity delete permission', () => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, {
          ...entityMock,
          mode: 'archived' as NoticeModeType,
        });
        expect(() => {
          endpointEntity.delete(userMock);
        }).toThrow(UnauthorizedError);
      });
    });

    describe('Test user permission', () => {
      it('Can access', () => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, {
          ...entityMock,
          mode: 'archived' as NoticeModeType,
        });
        expect(endpointEntity.canAccess(userMock)).toEqual(true);
      });

      it('Can access by Id', () => {
        const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
        expect(
          endpointEntity.canAccessById(
            { ...userMock, roles: [] },
            {
              ...entityMock,
              mode: 'published' as NoticeModeType,
            }
          )
        ).toEqual(true);

        expect(endpointEntity.canAccessById(userMock, entityMock)).toEqual(true);
      });
    });

    it('Cannot access by Id', () => {
      const endpointEntity = new NoticeApplicationEntity(repositoryMock, entityMock);
      expect(endpointEntity.canAccessById({ ...userMock, roles: [] }, entityMock)).toEqual(false);
    });
  });
});
