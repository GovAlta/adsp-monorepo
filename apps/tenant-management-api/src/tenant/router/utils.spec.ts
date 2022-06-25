import { InvalidOperationError, InvalidValueError } from '@core-services/core-common';
import { Logger } from 'winston';
import { TenantRepository } from '../repository';
import { validateEmailInDB, validateName } from './utils';

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

    it('can throw for duplicate name', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([{ name }]);
      await expect(
        validateName(loggerMock as Logger, repositoryMock as unknown as TenantRepository, name)
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
  });
});
