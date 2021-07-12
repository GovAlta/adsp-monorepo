import type { Request, Response } from 'express';
// This is for the Express type declarations;
import * as _ignored from './index';
import { adspId } from '../utils';
import { createConfigurationHandler } from './configurationHandler';

describe('createTenantHandler', () => {
  const serviceMock = {
    getConfiguration: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.getConfiguration.mockReset();
  });

  it('can create handler', () => {
    const handler = createConfigurationHandler(serviceMock, adspId`urn:ads:platform:test`);
    expect(handler).toBeTruthy();
  });

  it('can add configuration getter', async (done) => {
    const handler = createConfigurationHandler(serviceMock, adspId`urn:ads:platform:test`);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const config = 'this is config';
    serviceMock.getConfiguration.mockReturnValue(config);

    const req: Request = { user: { tenantId, token: { bearer: 'test' } } } as Request;
    const next = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((req as Request).getConfiguration).toBeTruthy();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((req as Request).getConfiguration()).toBe(config);

      done();
    };

    handler(req, ({} as unknown) as Response, next);
  });
});
