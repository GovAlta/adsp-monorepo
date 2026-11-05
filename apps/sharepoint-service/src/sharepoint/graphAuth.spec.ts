import { Logger } from 'winston';
import { acquireGraphToken } from './graphAuth';

const mockGetToken = jest.fn();
jest.mock('@azure/identity', () => ({
  ClientSecretCredential: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,
  })),
}));

describe('acquireGraphToken', () => {
  const logger = { error: jest.fn() } as unknown as Logger;
  const connection = { azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves when the credential successfully acquires a token', async () => {
    mockGetToken.mockResolvedValue({ token: 'abc', expiresOnTimestamp: Date.now() });

    await expect(acquireGraphToken('tenant-a', 'intake-form', connection, logger)).resolves.toBeUndefined();
  });

  it('reuses the cached credential for the same tenant and destination', async () => {
    mockGetToken.mockResolvedValue({ token: 'abc', expiresOnTimestamp: Date.now() });
    const { ClientSecretCredential } = jest.requireMock('@azure/identity');

    await acquireGraphToken('tenant-b', 'intake-form', connection, logger);
    await acquireGraphToken('tenant-b', 'intake-form', connection, logger);

    expect(ClientSecretCredential).toHaveBeenCalledTimes(1);
  });

  it('creates a separate credential for a different destination', async () => {
    mockGetToken.mockResolvedValue({ token: 'abc', expiresOnTimestamp: Date.now() });
    const { ClientSecretCredential } = jest.requireMock('@azure/identity');

    await acquireGraphToken('tenant-c', 'intake-form', connection, logger);
    await acquireGraphToken('tenant-c', 'renewal-form', connection, logger);

    expect(ClientSecretCredential).toHaveBeenCalledTimes(2);
  });

  it('throws a generic error when token acquisition fails', async () => {
    mockGetToken.mockRejectedValue(new Error('AADSTS900023: invalid tenant'));

    await expect(acquireGraphToken('tenant-d', 'intake-form', connection, logger)).rejects.toThrow(
      'Unable to authenticate to Microsoft Graph for this connection.',
    );
  });

  it('throws a generic error when the credential rejects with a non-Error value', async () => {
    mockGetToken.mockRejectedValue('transient network failure');

    await expect(acquireGraphToken('tenant-f', 'intake-form', connection, logger)).rejects.toThrow(
      'Unable to authenticate to Microsoft Graph for this connection.',
    );
  });

  it('logs the underlying Microsoft error without including the client secret', async () => {
    mockGetToken.mockRejectedValue(new Error('AADSTS900023: invalid tenant'));

    await acquireGraphToken('tenant-e', 'intake-form', connection, logger).catch(() => undefined);

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('AADSTS900023'));
    expect(logger.error).not.toHaveBeenCalledWith(expect.stringContaining(connection.clientSecret));
  });
});
