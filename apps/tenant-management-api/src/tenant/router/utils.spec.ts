import { InvalidOperationError, InvalidValueError } from '@core-services/core-common';
import { Logger } from 'winston';
import { TenantRepository } from '../repository';
import { normalizeTenantName, validateEmailInDB, validateName } from './utils';

describe('utils', () => {
  const repositoryMock = {
    save: jest.fn(),
    find: jest.fn(),
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    repositoryMock.save.mockReset();
    repositoryMock.find.mockReset();
  });

  describe('validateEmailInDB', () => {
    it('can pass for new tenant owner', async () => {
      const email = 'test-admin@gov.ab.ca';
      repositoryMock.find.mockResolvedValueOnce([]);
      await validateEmailInDB(loggerMock as Logger, repositoryMock as unknown as TenantRepository, email);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ adminEmailEquals: email }));
    });

    it('can throw for owner with existing tenant', async () => {
      const email = 'test-admin@gov.ab.ca';
      repositoryMock.find.mockResolvedValueOnce([{ adminEmail: email }]);
      await expect(
        validateEmailInDB(loggerMock as Logger, repositoryMock as unknown as TenantRepository, email)
      ).rejects.toThrow(InvalidOperationError);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ adminEmailEquals: email }));
    });
  });

  describe('validateName', () => {
    it('can validate name', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([]);
      await validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ nameEquals: name }));
    });

    it.each([123, undefined])('can throw for non-string name %p', async (name) => {
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name as unknown as string)
      ).rejects.toThrow(InvalidValueError);
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });

    it('can throw for duplicate name', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([{ name }]);
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name)
      ).rejects.toThrow(InvalidValueError);
    });

    it('can allow the excluded tenant to keep its name', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([{ id: 'tenant-a', name: 'MY TENANT' }]);
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name, 'tenant-a')
      ).resolves.toBeUndefined();
    });

    it('can throw for duplicate name of another tenant when excluding a tenant', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([{ id: 'tenant-b', name }]);
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name, 'tenant-a')
      ).rejects.toThrow(InvalidValueError);
    });

    it('can throw for invalid character in name', async () => {
      const name = 'My tenant!';
      repositoryMock.find.mockResolvedValueOnce([]);
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name)
      ).rejects.toThrow(InvalidValueError);
    });

    it('can throw for empty name', async () => {
      const name = '';
      repositoryMock.find.mockResolvedValueOnce([]);
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name)
      ).rejects.toThrow(InvalidValueError);
    });

    it('can throw for name of only spaces', async () => {
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, '   ')
      ).rejects.toThrow(InvalidValueError);
      expect(repositoryMock.find).not.toHaveBeenCalled();
    });
  });

  describe('normalizeTenantName', () => {
    it.each([
      ['  Child Care  ', 'Child Care'],
      ['Child   Care', 'Child Care'],
      [' Child  Care  Subsidy ', 'Child Care Subsidy'],
      ['Child Care', 'Child Care'],
      ['   ', ''],
    ])('can normalize %p to %p', (name, expected) => {
      expect(normalizeTenantName(name)).toBe(expected);
    });

    it.each([123, undefined, null])('can leave non-string name %p for validation to reject', (name) => {
      expect(normalizeTenantName(name)).toBe(name);
    });
  });
});
