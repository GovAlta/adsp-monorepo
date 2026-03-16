import { Logger } from 'winston';
import { TenantService } from '../tenant';
import { adspId } from '../utils';
import { createRealmStrategy } from './createRealmStrategy';

interface TestStrategy {
  _verify: (req: unknown, payload: Record<string, unknown>, done: (err: unknown, user?: Express.User) => void) => void;
}

describe('createRealmStrategy', () => {
  const tenantServiceMock = {
    getTenantByRealm: jest.fn(),
  };
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  it('can create strategy', async () => {
    const strategy = await createRealmStrategy({
      realm: 'core',
      serviceId: adspId`urn:ads:platform:test`,
      tenantService: tenantServiceMock as unknown as TenantService,
      accessServiceUrl: new URL('https://access-service'),
      logger: loggerMock,
      ignoreServiceAud: false,
    });
    expect(strategy).toBeTruthy();
  });

  it('can create tenant realm strategy', async () => {
    tenantServiceMock.getTenantByRealm.mockResolvedValueOnce({
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      realm: 'test',
    });
    const strategy = await createRealmStrategy({
      realm: 'test',
      serviceId: adspId`urn:ads:platform:test`,
      tenantService: tenantServiceMock as unknown as TenantService,
      accessServiceUrl: new URL('https://access-service'),
      logger: loggerMock,
      ignoreServiceAud: false,
    });
    expect(strategy).toBeTruthy();
    expect(tenantServiceMock.getTenantByRealm).toHaveBeenCalled();
  });

  it('uses token from additional extractor for bearer', async () => {
    const strategy = (await createRealmStrategy({
      realm: 'core',
      serviceId: adspId`urn:ads:platform:test`,
      tenantService: tenantServiceMock as unknown as TenantService,
      accessServiceUrl: new URL('https://access-service'),
      logger: loggerMock,
      ignoreServiceAud: false,
      additionalExtractors: [() => 'custom-token'],
    })) as unknown as TestStrategy;

    const req = { headers: {} };
    const payload = { sub: 'abc', preferred_username: 'test-user', email: 'test@example.com' };
    const done = jest.fn();

    strategy._verify(req, payload, done);

    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        token: expect.objectContaining({ bearer: 'custom-token' }),
      })
    );
  });
});
