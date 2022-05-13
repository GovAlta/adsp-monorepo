import type { Request, Response } from 'express';
// This is for the Express type declarations;
import * as _ignored from './index';
import { adspId } from '../utils';
import { createConfigurationHandler, createTenantConfigurationHandler } from './configurationHandler';

describe('createTenantHandler', () => {
  const serviceMock = {
    getConfiguration: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  beforeEach(() => {
    serviceMock.getConfiguration.mockReset();
  });

  it('can create handler', () => {
    const handler = createConfigurationHandler(tokenProviderMock, serviceMock, adspId`urn:ads:platform:test`);
    expect(handler).toBeTruthy();
  });

  it('can create tenant handler', () => {
    const handler = createTenantConfigurationHandler(
      tokenProviderMock,
      serviceMock,
      adspId`urn:ads:platform:test`,
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );
    expect(handler).toBeTruthy();
  });

  it('can add configuration getter', (done) => {
    const handler = createConfigurationHandler(tokenProviderMock, serviceMock, adspId`urn:ads:platform:test`);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const config = 'this is config';
    serviceMock.getConfiguration.mockResolvedValueOnce(config);

    const req: Request = { user: { tenantId, token: { bearer: 'test' } } } as Request;
    const next = async () => {
      expect((req as Request).getConfiguration).toBeTruthy();
      expect(await (req as Request).getConfiguration()).toBe(config);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can add tenant configuration getter', (done) => {
    const serviceId = adspId`urn:ads:platform:test`;
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const handler = createTenantConfigurationHandler(tokenProviderMock, serviceMock, serviceId, tenantId);

    const config = 'this is config';
    serviceMock.getConfiguration.mockResolvedValueOnce(config);

    const req: Request = {
      user: { tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`, token: { bearer: 'test' } },
    } as Request;
    const next = async () => {
      expect((req as Request).getConfiguration).toBeTruthy();
      expect(await (req as Request).getConfiguration()).toBe(config);
      expect(serviceMock.getConfiguration).toHaveBeenCalledWith(serviceId, expect.any(String), tenantId);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });
});
