import { AdspId, Tenant, adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { createTenantHandler } from './tenant';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';

describe('createTenantHandler', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  beforeEach(() => {
    tenantServiceMock.getTenant.mockClear();
  });

  it('can create handler', () => {
    const handler = createTenantHandler(tenantServiceMock);
    expect(handler).toBeTruthy();
  });

  it('can get tenant from request header', async () => {
    const handler = createTenantHandler(tenantServiceMock);

    const req = {
      headers: { 'x-adsp-tenant': tenantId.toString() },
    };
    const res = {};
    const next = jest.fn();

    const tenant: Tenant = {
      id: tenantId,
      name: 'Test',
      realm: 'test',
    };
    tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);
    await handler(req as unknown as Request, res as Response, next);

    expect(tenantServiceMock.getTenant).toHaveBeenCalledWith(expect.any(AdspId));
    expect(req['tenant']).toBe(tenant);
    expect(next).toHaveBeenCalledWith();
  });

  it('can call next with invalid operation for no tenant ID.', async () => {
    const handler = createTenantHandler(tenantServiceMock);

    const req = {
      headers: {},
    };
    const res = {};
    const next = jest.fn();

    await handler(req as unknown as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
  });

  it('can call next with not found for invalid tenant ID.', async () => {
    const handler = createTenantHandler(tenantServiceMock);

    const req = {
      headers: { 'x-adsp-tenant': 'not a tenant ID' },
    };
    const res = {};
    const next = jest.fn();

    await handler(req as unknown as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it('can call next with not found for tenant not returned', async () => {
    const handler = createTenantHandler(tenantServiceMock);

    const req = {
      headers: { 'x-adsp-tenant': tenantId.toString() },
    };
    const res = {};
    const next = jest.fn();

    tenantServiceMock.getTenant.mockResolvedValueOnce(null);
    await handler(req as unknown as Request, res as Response, next);

    expect(tenantServiceMock.getTenant).toHaveBeenCalledWith(expect.any(AdspId));
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});
