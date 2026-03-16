import { Logger } from 'winston';
import { TenantService } from '../tenant';
import { adspId } from '../utils';
import { createTenantStrategy } from './createTenantStrategy';

interface TestStrategy {
  _verify: (req: unknown, payload: Record<string, unknown>, done: (err: unknown, user?: Express.User) => void) => Promise<void>;
}

describe('createTenantStrategy', () => {
  const tenantServiceMock = {
    getTenants: jest.fn().mockResolvedValue([]),
  };
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  it('can create strategy', () => {
    const strategy = createTenantStrategy({
      serviceId: adspId`urn:ads:platform:test`,
      tenantService: tenantServiceMock as unknown as TenantService,
      accessServiceUrl: new URL('https://access-service'),
      logger: loggerMock,
      ignoreServiceAud: false,
    });
    expect(strategy).toBeTruthy();
  });

  it('uses token from additional extractor for bearer', async () => {
    const strategy = createTenantStrategy({
      serviceId: adspId`urn:ads:platform:test`,
      tenantService: tenantServiceMock as unknown as TenantService,
      accessServiceUrl: new URL('https://access-service'),
      logger: loggerMock,
      ignoreServiceAud: false,
      additionalExtractors: [() => 'custom-token'],
    }) as unknown as TestStrategy;

    const req = { headers: {} };
    const payload = { iss: 'https://access-service/auth/realms/test', sub: 'abc', preferred_username: 'test-user', email: 'test@example.com' };
    const done = jest.fn();

    await strategy._verify(req, payload, done);

    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        token: expect.objectContaining({ bearer: 'custom-token' }),
      }),
      null
    );
  });
});
