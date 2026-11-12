import { adspId, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  CodeAttemptsExceededClearedAuditAction,
  CodeGeneratedAuditAction,
  CodeVerifyFailedAuditAction,
  CodeVerifySucceededAuditAction,
} from './audit';
import { VerifyUserRoles } from './roles';
import { createVerifyService } from './service';

describe('createVerifyService', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    get: jest.fn(),
    set: jest.fn(),
    failed: jest.fn(),
  };
  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };
  beforeEach(() => {
    repositoryMock.get.mockReset();
    repositoryMock.set.mockReset();
    repositoryMock.failed.mockReset();
    auditServiceMock.record.mockReset();
  });

  it('can create service', () => {
    const service = createVerifyService({
      logger: loggerMock,
      repository: repositoryMock,
      auditService: auditServiceMock,
    });
    expect(service).toBeTruthy();
  });

  describe('VerifyService', () => {
    describe('generate', () => {
      it('can generate code', async () => {
        const key = 'test';
        repositoryMock.set.mockResolvedValueOnce({ key });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.generate(
          {
            roles: [VerifyUserRoles.Generator],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          15,
        );

        expect(repositoryMock.set).toHaveBeenCalledTimes(1);
        expect(result.key).toBe(key);
        expect(result.code).toBeTruthy();
        expect(result.expiresAt > new Date()).toBeTruthy();
      });

      it('can generate for core user', async () => {
        const key = 'test';
        repositoryMock.set.mockResolvedValueOnce({ key });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.generate(
          {
            roles: [VerifyUserRoles.Generator],
            isCore: true,
          } as User,
          key,
        );

        expect(repositoryMock.set).toHaveBeenCalledTimes(1);
        expect(result.key).toBe(key);
        expect(result.code).toBeTruthy();
        expect(result.expiresAt > new Date()).toBeTruthy();
      });

      it('can throw for unauthorized user', () => {
        const key = 'test';
        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        expect(() =>
          service.generate(
            {
              roles: [],
              tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
            } as User,
            key,
          ),
        ).toThrow();
      });
    });

    describe('verify', () => {
      it('can return true for valid code', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce({ key, code });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.verify(
          {
            roles: [VerifyUserRoles.Verifier],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          code,
        );
        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
      });

      it('can return false for invalid code', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce({ key, code: '321' });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.verify(
          {
            roles: [VerifyUserRoles.Verifier],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          code,
        );
        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
      });

      it('can return false for no record', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce(null);

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.verify(
          {
            roles: [VerifyUserRoles.Verifier],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          code,
        );
        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
      });

      it('can verify for non-tenant user', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce({ key, code });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.verify(
          {
            roles: [VerifyUserRoles.Verifier],
            isCore: true,
          } as User,
          key,
          code,
        );

        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
      });

      it('can throw for unauthorized user', async () => {
        const key = 'test';
        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        expect(() =>
          service.verify(
            {
              roles: [],
              tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
            } as User,
            key,
            '123456',
          ),
        ).toThrow();
      });
    });

    describe('audit', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const key = 'test-key';
      const serviceAccount = {
        id: 'service-account-id',
        name: 'service-account-urn:ads:platform:test-service',
        email: null,
        roles: [VerifyUserRoles.Generator, VerifyUserRoles.Verifier],
        tenantId,
      } as unknown as User;
      const serviceActor = {
        id: 'service-account-id',
        type: 'service',
        name: 'service-account-urn:ads:platform:test-service',
        roles: [VerifyUserRoles.Generator, VerifyUserRoles.Verifier],
      };
      const resource = { type: 'verify-code', id: key };

      it('records code generated with the key and expiry, but not the code', async () => {
        repositoryMock.set.mockResolvedValueOnce({ key });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        const result = await service.generate(serviceAccount, key, 15);

        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(CodeGeneratedAuditAction, {
          tenantId,
          status: 'success',
          actor: serviceActor,
          resource,
          metadata: { codeKey: key, expiresAt: result.expiresAt.toISOString() },
        });
        expect(JSON.stringify(auditServiceMock.record.mock.calls[0][1])).not.toContain(result.code);
      });

      it('does not record code generated when saving the code fails', async () => {
        repositoryMock.set.mockRejectedValueOnce(new Error('oh noes!'));

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        await expect(service.generate(serviceAccount, key)).rejects.toThrow('oh noes!');
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });

      it('records code verified succeeded', async () => {
        repositoryMock.get.mockResolvedValueOnce({ key, code: 'CF4HKR', failures: 0 });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        await service.verify(serviceAccount, key, 'CF4HKR');

        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(CodeVerifySucceededAuditAction, {
          tenantId,
          status: 'success',
          actor: serviceActor,
          resource,
          metadata: { codeKey: key, verified: true },
        });
      });

      it('records code verified failed for a code that does not match', async () => {
        repositoryMock.get.mockResolvedValueOnce({ key, code: 'CF4HKR', failures: 0 });
        repositoryMock.failed.mockResolvedValueOnce(false);

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        await service.verify(serviceAccount, key, 'WRONG1');

        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(CodeVerifyFailedAuditAction, {
          tenantId,
          status: 'failure',
          actor: serviceActor,
          resource,
          metadata: { codeKey: key, verified: false, reason: 'mismatch' },
        });
        expect(JSON.stringify(auditServiceMock.record.mock.calls)).not.toMatch(/CF4HKR|WRONG1/);
      });

      it('records code verified failed when there is no code at the key', async () => {
        repositoryMock.get.mockResolvedValueOnce(null);

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        await service.verify(serviceAccount, key, 'CF4HKR');

        expect(repositoryMock.failed).not.toHaveBeenCalled();
        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(
          CodeVerifyFailedAuditAction,
          expect.objectContaining({
            status: 'failure',
            metadata: { codeKey: key, verified: false, reason: 'not-found' },
          }),
        );
      });

      it('records code attempts exceeded cleared when failures reach the maximum', async () => {
        repositoryMock.get.mockResolvedValue({ key, code: 'CF4HKR', failures: 0 });
        repositoryMock.failed.mockImplementation(async () => repositoryMock.failed.mock.calls.length === 10);

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        for (let i = 0; i < 10; i++) {
          await service.verify(serviceAccount, key, 'WRONG1');
        }

        const actions = auditServiceMock.record.mock.calls.map(([action]) => action.name);
        expect(actions.filter((name) => name === 'code.verified.failed')).toHaveLength(10);
        expect(actions.filter((name) => name === 'code.attempts-exceeded-cleared')).toHaveLength(1);
        expect(actions[actions.length - 1]).toBe('code.attempts-exceeded-cleared');
        expect(CodeAttemptsExceededClearedAuditAction.severity).toBe('warning');
        expect(auditServiceMock.record).toHaveBeenLastCalledWith(CodeAttemptsExceededClearedAuditAction, {
          tenantId,
          status: 'success',
          actor: serviceActor,
          resource,
          metadata: { codeKey: key, maxFailedVerifications: 10 },
        });
      });

      it('records to the specified tenant for a core user', async () => {
        repositoryMock.get.mockResolvedValueOnce({ key, code: 'CF4HKR', failures: 0 });
        const coreUser = {
          id: 'core-service-account',
          name: 'service-account-urn:ads:platform:notification-service',
          roles: [VerifyUserRoles.Verifier],
          isCore: true,
        } as User;

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        await service.verify(coreUser, key, 'CF4HKR', tenantId);

        expect(repositoryMock.get).toHaveBeenCalledWith(`core:${key}`);
        expect(auditServiceMock.record).toHaveBeenCalledWith(
          CodeVerifySucceededAuditAction,
          expect.objectContaining({
            tenantId,
            actor: expect.objectContaining({ id: 'core-service-account', type: 'service' }),
          }),
        );
      });

      it('does not record for a core user without a tenant', async () => {
        repositoryMock.set.mockResolvedValueOnce({ key });

        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        await service.generate({ id: 'core', roles: [VerifyUserRoles.Generator], isCore: true } as User, key);

        expect(repositoryMock.set).toHaveBeenCalled();
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });

      it('does not record for an unauthorized user', async () => {
        const service = createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        });
        expect(() => service.verify({ id: 'tester', roles: [], tenantId } as User, key, 'CF4HKR')).toThrow();
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });
    });
  });
});
