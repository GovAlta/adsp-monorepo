import { Logger } from 'winston';
import { TenantService } from '../tenant';
import { adspId } from '../utils';
import { createTenantStrategy } from './createTenantStrategy';

describe('createTenantStrategy', () => {
  const tenantServiceMock = {};
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
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
});
