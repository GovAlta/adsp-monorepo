import type { Request, Response } from 'express';
import { adspId } from '../utils';
import { createTenantHandler } from './tenantHandler';

describe('createTenantHandler', () => {
  const serviceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.getTenant.mockReset();
    serviceMock.getTenants.mockReset();
    serviceMock.getTenantByName.mockReset();
    serviceMock.getTenantByRealm.mockReset();
  });

  it('can create handler', () => {
    const handler = createTenantHandler(serviceMock);
    expect(handler).toBeTruthy();
  });

  it('can set request tenant', (done) => {
    const handler = createTenantHandler(serviceMock);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const tenant = { id: tenantId, name: 'test', realm: 'test' };

    const req: Request = { user: { tenantId }, query: {} } as Request;
    const next = () => {
      expect(req.tenant).toBe(tenant);
      done();
    };

    serviceMock.getTenant.mockReturnValueOnce(Promise.resolve(tenant));
    handler(req, {} as unknown as Response, next);
  });

  it('can set request tenant from query', (done) => {
    const handler = createTenantHandler(serviceMock);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const tenant = { id: tenantId, name: 'test', realm: 'test' };

    const req: Request = { user: { isCore: true }, query: { tenantId: tenantId.toString() } } as unknown as Request;
    const next = () => {
      expect(req.tenant).toBe(tenant);
      done();
    };

    serviceMock.getTenant.mockReturnValueOnce(Promise.resolve(tenant));
    handler(req, {} as unknown as Response, next);
  });

  it('can ignore request tenant from query for non core user', (done) => {
    const handler = createTenantHandler(serviceMock);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const tenant = { id: tenantId, name: 'test', realm: 'test' };

    const req: Request = {
      user: { tenantId },
      query: { tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test2' },
    } as unknown as Request;
    const next = () => {
      expect(req.tenant).toBe(tenant);
      done();
    };

    serviceMock.getTenant.mockReturnValueOnce(Promise.resolve(tenant));
    handler(req, {} as unknown as Response, next);
    expect(serviceMock.getTenant).toHaveBeenCalledWith(tenantId);
  });

  it('can ignore request without user.', (done) => {
    const handler = createTenantHandler(serviceMock);

    const req: Request = { query: {} } as Request;
    const next = () => {
      expect(req.tenant).toBeFalsy();
      expect(serviceMock.getTenant.mock.calls.length).toBe(0);
      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can ignore request without tenantId.', (done) => {
    const handler = createTenantHandler(serviceMock);

    const req: Request = { user: {}, query: {} } as Request;
    const next = () => {
      expect(req.tenant).toBeFalsy();
      expect(serviceMock.getTenant.mock.calls.length).toBe(0);
      done();
    };

    handler(req, {} as unknown as Response, next);
  });

  it('can return error if service throws.', (done) => {
    const handler = createTenantHandler(serviceMock);

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

    const req: Request = { user: { tenantId }, query: {} } as Request;

    serviceMock.getTenant.mockRejectedValueOnce(new Error('Something went terribly wrong.'));
    handler(req, {} as unknown as Response, (err: unknown) => {
      expect(err).toBeTruthy();
      done();
    });
  });
});
