import { adspId, Channel, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { FormServiceRoles } from '../roles';
import { FormStatus } from '../types';
import { FormDefinitionEntity } from './definition';
import { FormEntity } from './form';

describe('FormEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const definition = new FormDefinitionEntity(tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
  });

  const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
  const subscriber = {
    id: 'test',
    urn: subscriberId,
    userId: null,
    addressAs: 'Tester',
    channels: [{ channel: Channel.email, address: 'test@test.co' }],
  };

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((save) => Promise.resolve(save)),
    delete: jest.fn(),
  };

  const notificationMock = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const fileMock = {
    delete: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.save.mockClear();
    repositoryMock.delete.mockClear();
    notificationMock.sendCode.mockReset();
    notificationMock.verifyCode.mockReset();
  });

  it('it can be created', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);
    expect(entity).toBeTruthy();
    expect(entity).toMatchObject(formInfo);
  });

  describe('create', () => {
    it('can create draft form', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      } as User;

      const entity = await FormEntity.create(user, repositoryMock, definition, notificationMock, subscriber);
      expect(entity).toBeTruthy();
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can fail for unauthorized user', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: [],
      } as User;

      await expect(FormEntity.create(user, repositoryMock, definition, notificationMock, subscriber)).rejects.toThrow(
        UnauthorizedUserError
      );
    });
  });

  describe('canAssess', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can return true for user with assessor role', () => {
      const result = entity.canAssess({ tenantId, id: 'tester', roles: ['test-assessor'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without assessor role', () => {
      const result = entity.canAssess({ tenantId, id: 'tester', roles: [] } as User);
      expect(result).toBe(false);
    });
  });

  describe('sendCode', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can send code', async () => {
      notificationMock.sendCode.mockResolvedValueOnce(null);
      await entity.sendCode({ tenantId, id: 'tester', roles: ['intake-application'] } as User, notificationMock);
      expect(notificationMock.sendCode).toHaveBeenCalledWith(tenantId, subscriber);
    });

    it('can throw for not intake application', async () => {
      notificationMock.sendCode.mockResolvedValueOnce(null);
      await expect(entity.sendCode({ tenantId, id: 'tester', roles: [] } as User, notificationMock)).rejects.toThrow(
        UnauthorizedUserError
      );
    });
  });

  describe('accessByCode', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can access form data', async () => {
      const code = '123';
      notificationMock.verifyCode.mockResolvedValueOnce(true);
      const before = entity.lastAccessed;
      const result = await entity.accessByCode(
        { tenantId, id: 'tester', roles: ['intake-application'] } as User,
        notificationMock,
        code
      );
      expect(notificationMock.verifyCode).toHaveBeenCalledWith(tenantId, subscriber, code);
      expect(result.lastAccessed.valueOf()).toBeGreaterThan(before.valueOf());
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for non-draft form', async () => {
      const nonDraft = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      nonDraft.status = FormStatus.Archived;
      const code = '123';
      await expect(
        nonDraft.accessByCode({ tenantId, id: 'tester', roles: ['intake-application'] } as User, notificationMock, code)
      ).rejects.toThrow(InvalidOperationError);
    });

    it('can throw for non-intake application', async () => {
      const code = '123';
      await expect(
        entity.accessByCode({ tenantId, id: 'tester', roles: [] } as User, notificationMock, code)
      ).rejects.toThrow(UnauthorizedUserError);
    });

    it('can throw for failed verification', async () => {
      const code = '123';
      notificationMock.verifyCode.mockResolvedValueOnce(false);
      await expect(
        entity.accessByCode({ tenantId, id: 'tester', roles: ['intake-application'] } as User, notificationMock, code)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('accessByUser', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can return true for applicant on draft form', async () => {
      const before = entity.lastAccessed;
      const result = await entity.accessByUser({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result.lastAccessed.valueOf()).toBeGreaterThan(before.valueOf());
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for user without role on draft form', async () => {
      await expect(entity.accessByUser({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(
        UnauthorizedUserError
      );
    });

    it('can throw for intake application role on draft form', async () => {
      await expect(
        entity.accessByUser({ tenantId, id: 'tester', roles: [FormServiceRoles.IntakeApp] } as User)
      ).rejects.toThrow(UnauthorizedUserError);
    });

    it('can return true for assessor on submitted form', async () => {
      const submitted = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      submitted.status = FormStatus.Submitted;

      const before = entity.lastAccessed;
      const result = await submitted.accessByUser({ tenantId, id: 'tester', roles: ['test-assessor'] } as User);
      expect(result.lastAccessed.valueOf()).toBeGreaterThan(before.valueOf());
    });

    it('can throw for user without role on submitted form', async () => {
      const submitted = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      submitted.status = FormStatus.Submitted;

      await expect(submitted.accessByUser({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(
        UnauthorizedUserError
      );
    });

    it('can throw for locked form', async () => {
      const locked = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      locked.status = FormStatus.Locked;

      await expect(locked.accessByUser({ tenantId, id: 'tester', roles: ['test-applicant'] } as User)).rejects.toThrow(
        InvalidOperationError
      );
    });
  });

  describe('update', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can update form content', async () => {
      const data = {};
      const files = {};
      const updated = await entity.update({ tenantId, id: 'tester', roles: ['test-applicant'] } as User, data, files);
      expect(updated.data).toBe(data);
      expect(updated.files).toBe(files);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for form not in draft', async () => {
      const locked = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      locked.status = FormStatus.Locked;

      const data = {};
      const files = {};
      await expect(
        locked.update({ tenantId, id: 'tester', roles: ['test-applicant'] } as User, data, files)
      ).rejects.toThrow(InvalidOperationError);
    });

    it('can throw for file not a resource', async () => {
      const data = {};
      const files = {
        support: adspId`urn:ads:platform:file-service`,
      };

      await expect(
        entity.update({ tenantId, id: 'tester', roles: ['test-applicant'] } as User, data, files)
      ).rejects.toThrow(Error);
    });

    it('can throw for different user', async () => {
      const data = {};
      const files = {};
      await expect(
        entity.update({ tenantId, id: 'tester-2', roles: ['test-applicant'] } as User, data, files)
      ).rejects.toThrow(UnauthorizedUserError);
    });

    it('can throw for user without applicant role', async () => {
      const data = {};
      const files = {};
      await expect(entity.update({ tenantId, id: 'tester', roles: [] } as User, data, files)).rejects.toThrow(
        UnauthorizedUserError
      );
    });
  });

  describe('lock', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can lock form', async () => {
      const locked = await entity.lock({ tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User);
      expect(locked.status).toBe(FormStatus.Locked);
      expect(locked.locked).toBeTruthy();
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for non-admin', async () => {
      await expect(entity.lock({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(UnauthorizedUserError);
    });

    it('can throw for form not in draft', async () => {
      const submitted = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      submitted.status = FormStatus.Submitted;
      await expect(entity.lock({ tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User)).rejects.toThrow(
        InvalidOperationError
      );
    });
  });

  describe('lock', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Locked,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can unlock form', async () => {
      const unlocked = await entity.unlock({ tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User);
      expect(unlocked.status).toBe(FormStatus.Draft);
      expect(unlocked.locked).toBeFalsy();
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for non-admin', async () => {
      await expect(entity.unlock({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(UnauthorizedUserError);
    });

    it('can throw for form not in locked', async () => {
      const draft = new FormEntity(repositoryMock, definition, subscriber, formInfo);
      draft.status = FormStatus.Draft;
      await expect(draft.unlock({ tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User)).rejects.toThrow(
        InvalidOperationError
      );
    });
  });

  describe('submit', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Locked,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can submit form', async () => {
      const submitted = await entity.submit({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(submitted.status).toBe(FormStatus.Submitted);
      expect(submitted.submitted).toBeTruthy();
      expect(submitted.hash).toBeTruthy();
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for different user', async () => {
      await expect(entity.submit({ tenantId, id: 'tester-2', roles: ['test-applicant'] } as User)).rejects.toThrow(
        UnauthorizedUserError
      );
    });

    it('can throw for user without applicant role', async () => {
      await expect(entity.submit({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(UnauthorizedUserError);
    });
  });

  describe('archive', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Locked,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can archive form', async () => {
      const archived = await entity.archive({ tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User);
      expect(archived.status).toBe(FormStatus.Archived);
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });

    it('can throw for non admin user', async () => {
      await expect(entity.archive({ tenantId, id: 'tester', roles: [] } as User)).rejects.toThrow(
        UnauthorizedUserError
      );
    });
  });

  describe('delete', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Locked,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {
        test: adspId`urn:ads:platform:file-service:v1:/files/test`,
      },
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);

    it('can delete form', async () => {
      repositoryMock.delete.mockResolvedValueOnce(true);
      fileMock.delete.mockResolvedValueOnce(true);
      const deleted = await entity.delete(
        { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] } as User,
        fileMock,
        notificationMock
      );
      expect(deleted).toBe(true);
      expect(fileMock.delete).toHaveBeenCalled();
      expect(notificationMock.unsubscribe).toHaveBeenCalled();
      expect(repositoryMock.delete).toHaveBeenCalledWith(entity);
    });

    it('can throw for non admin user', async () => {
      await expect(
        entity.delete({ tenantId, id: 'tester', roles: [] } as User, fileMock, notificationMock)
      ).rejects.toThrow(UnauthorizedUserError);
    });
  });
});
