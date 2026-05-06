import type { Request, Response } from 'express';
// This is for the Express type declarations;
import './index';
import { adspId } from '../utils';
import { createConfigurationHandler, createTenantConfigurationHandler } from './configurationHandler';

describe('createTenantHandler', () => {
  const serviceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  beforeEach(() => {
    serviceMock.getConfiguration.mockReset();
    serviceMock.getServiceConfiguration.mockReset();
    serviceMock.getServiceConfigurationRevision.mockReset();
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
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
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

  it('can add service configuration getter', (done) => {
    const handler = createConfigurationHandler(tokenProviderMock, serviceMock, adspId`urn:ads:platform:test`);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const config = 'this is config';
    serviceMock.getServiceConfiguration.mockResolvedValueOnce(config);

    const req: Request = { user: { tenantId, token: { bearer: 'test' } } } as Request;
    const next = async () => {
      expect((req as Request).getServiceConfiguration).toBeTruthy();
      expect(await (req as Request).getServiceConfiguration('test')).toBe(config);
      expect(serviceMock.getServiceConfiguration).toHaveBeenCalledWith('test', tenantId);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can add tenant service configuration getter', (done) => {
    const serviceId = adspId`urn:ads:platform:test`;
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const handler = createTenantConfigurationHandler(tokenProviderMock, serviceMock, serviceId, tenantId);

    const config = 'this is config';
    serviceMock.getServiceConfiguration.mockResolvedValueOnce(config);

    const req: Request = {
      user: { tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`, token: { bearer: 'test' } },
    } as Request;
    const next = async () => {
      expect((req as Request).getServiceConfiguration).toBeTruthy();
      expect(await (req as Request).getServiceConfiguration('test')).toBe(config);
      expect(serviceMock.getServiceConfiguration).toHaveBeenCalledWith('test', tenantId);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can add service configuration revision getter', (done) => {
    const handler = createConfigurationHandler(tokenProviderMock, serviceMock, adspId`urn:ads:platform:test`);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const config = 'this is config revision';

    serviceMock.getServiceConfigurationRevision.mockResolvedValueOnce(config);

    const req: Request = {
      user: { tenantId, token: { bearer: 'test' } },
    } as Request;

    const next = async () => {
      expect((req as Request).getServiceConfigurationRevision).toBeTruthy();

      expect(await (req as Request).getServiceConfigurationRevision('2', 'test')).toBe(config);

      expect(serviceMock.getServiceConfigurationRevision).toHaveBeenCalledWith('2', 'test', tenantId);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can add tenant service configuration revision getter', (done) => {
    const serviceId = adspId`urn:ads:platform:test`;
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

    const handler = createTenantConfigurationHandler(tokenProviderMock, serviceMock, serviceId, tenantId);

    const config = 'this is tenant config revision';

    serviceMock.getServiceConfigurationRevision.mockResolvedValueOnce(config);

    const req: Request = {
      user: {
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        token: { bearer: 'test' },
      },
    } as Request;

    const next = async () => {
      expect((req as Request).getServiceConfigurationRevision).toBeTruthy();

      expect(await (req as Request).getServiceConfigurationRevision('2', 'test')).toBe(config);

      expect(serviceMock.getServiceConfigurationRevision).toHaveBeenCalledWith('2', 'test', tenantId);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can get service configuration revision for specified tenant', (done) => {
    const handler = createConfigurationHandler(tokenProviderMock, serviceMock, adspId`urn:ads:platform:test`);

    const contextTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/context`;
    const specifiedTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/specified`;

    const config = 'this is specified tenant config revision';

    serviceMock.getServiceConfigurationRevision.mockResolvedValueOnce(config);

    const req: Request = {
      user: { tenantId: contextTenantId, token: { bearer: 'test' } },
    } as Request;

    const next = async () => {
      expect(await (req as Request).getServiceConfigurationRevision('3', 'test', specifiedTenantId)).toBe(config);

      expect(serviceMock.getServiceConfigurationRevision).toHaveBeenCalledWith('3', 'test', specifiedTenantId);

      done();
    };

    handler(req, {} as unknown as Response, next);
  });
});
