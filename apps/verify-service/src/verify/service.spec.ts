import { adspId, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { VerifyUserRoles } from './roles';
import { createVerifyService } from './service';

describe('createVerifyService', () => {
  const loggerMock = ({
    debug: jest.fn(),
    info: jest.fn(),
  } as unknown) as Logger;

  const repositoryMock = {
    get: jest.fn(),
    set: jest.fn(),
  };
  beforeEach(() => {
    repositoryMock.get.mockReset();
    repositoryMock.set.mockReset();
  });

  it('can create service', () => {
    const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
    expect(service).toBeTruthy();
  });

  describe('VerifyService', () => {
    describe('generate', () => {
      it('can generate code', async () => {
        const key = 'test';
        repositoryMock.set.mockResolvedValueOnce({ key });

        const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
        const result = await service.generate(
          {
            roles: [VerifyUserRoles.Generator],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key
        );
        expect(repositoryMock.set).toHaveBeenCalledTimes(1);
        expect(result.key).toBe(key);
        expect(result.code).toBeTruthy();
        expect(result.expiresAt > new Date()).toBeTruthy();
      });

      it('can throw for non-tenant user', async () => {
        const key = 'test';
        repositoryMock.set.mockResolvedValueOnce({ key });

        const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
        expect(() => {
          service.generate(
            {
              roles: [VerifyUserRoles.Generator],
              isCore: true,
            } as User,
            key
          );
        }).toThrow();
      });

      it('can throw for unauthorized user', () => {
        const key = 'test';
        const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
        expect(() =>
          service.generate(
            {
              roles: [],
              tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
            } as User,
            key
          )
        ).toThrow();
      });
    });

    describe('verify', () => {
      it('can return true for valid code', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce({ key, code });

        const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
        const result = await service.verify(
          {
            roles: [],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          code
        );
        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
      });

      it('can return false for invalid code', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce({ key, code: '321' });

        const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
        const result = await service.verify(
          {
            roles: [],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          code
        );
        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
      });

      it('can return false for no record', async () => {
        const key = 'test';
        const code = '123';
        repositoryMock.get.mockResolvedValueOnce(null);

        const service = createVerifyService({ logger: loggerMock, repository: repositoryMock });
        const result = await service.verify(
          {
            roles: [],
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          } as User,
          key,
          code
        );
        expect(repositoryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe(false);
      });
    });
  });
});
