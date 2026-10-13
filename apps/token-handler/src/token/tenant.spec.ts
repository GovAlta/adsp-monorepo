import { AdspId, Tenant, adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { createTenantHandler, keepTenantInSession, resolveTenant } from './tenant';
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
    tenantServiceMock.getTenant.mockReset();
    tenantServiceMock.getTenantByName.mockReset();
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

  describe('tenant names', () => {
    const tenant: Tenant = { id: tenantId, name: 'MyTenant', realm: 'realm-1' };

    const run = async (
      headers: Record<string, string>,
      extra: Record<string, unknown> = {},
      mode: 'initiate' | 'complete' = 'initiate'
    ) => {
      const req = { headers, query: {}, session: {}, ...extra };
      const next = jest.fn();
      await createTenantHandler(tenantServiceMock, mode)(req as unknown as Request, {} as Response, next);
      return { req, next };
    };

    it('can get tenant by the name as it is', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      const { req, next } = await run({ 'x-adsp-tenant': 'MyTenant' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledTimes(1);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('MyTenant');
      expect(req['tenant']).toBe(tenant);
      expect(next).toHaveBeenCalledWith();
    });

    it('can get tenant by a name with spaces', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ ...tenant, name: 'My Tenant' });

      await run({ 'x-adsp-tenant': 'My Tenant' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('My Tenant');
    });

    it('can get tenant by the kebab-case form of the name for a name with hyphens', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      const { req, next } = await run({ 'x-adsp-tenant': 'my-tenant' });

      // The kebab-case form is how the name has been provided, so it is looked up first.
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledTimes(1);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('my tenant');
      expect(req['tenant']).toBe(tenant);
      expect(next).toHaveBeenCalledWith();
    });

    it('can get tenant by a name with hyphens as it is when the kebab-case form is not found', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null).mockResolvedValueOnce(tenant);

      const { req, next } = await run({ 'x-adsp-tenant': 'my-tenant' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenNthCalledWith(1, 'my tenant');
      expect(tenantServiceMock.getTenantByName).toHaveBeenNthCalledWith(2, 'my-tenant');
      expect(req['tenant']).toBe(tenant);
      expect(next).toHaveBeenCalledWith();
    });

    it('does not look up a name without hyphens again', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValue(null);

      const { next } = await run({ 'x-adsp-tenant': 'nothing' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it.each(['.*', '.+', '^', '$', 'My.*', '(My|Other)', '[A-Z]+', 'a\nb', 'My%20Tenant', 'a'.repeat(51), '*'])(
      'does not look up a tenant for %s',
      async (value) => {
        const { next } = await run({ 'x-adsp-tenant': value });

        expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalled();
        expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      }
    );

    it('does not look up a tenant for a value that is too long', async () => {
      const { next } = await run({ 'x-adsp-tenant': `urn:ads:platform:tenant-service:v2:/tenants/${'a'.repeat(100)}` });

      expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with not found when the lookup fails', async () => {
      tenantServiceMock.getTenantByName.mockRejectedValue(new Error('unavailable'));

      const { next } = await run({ 'x-adsp-tenant': 'MyTenant' });

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('initiate sign in', () => {
    const tenant: Tenant = { id: tenantId, name: 'My Tenant', realm: 'realm-1' };

    const run = async (headers: Record<string, string>, query: Record<string, unknown>, session: object = {}) => {
      const req = { headers, query, session };
      const next = jest.fn();
      await createTenantHandler(tenantServiceMock, 'initiate')(req as unknown as Request, {} as Response, next);
      return { req, next };
    };

    it('can get the tenant from the query parameter', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      const { req, next } = await run({}, { tenant: 'My Tenant' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('My Tenant');
      expect(req['tenant']).toBe(tenant);
      expect(next).toHaveBeenCalledWith();
    });

    it('can get the tenant from the header rather than the query parameter', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      await run({ 'x-adsp-tenant': 'My Tenant' }, { tenant: 'Another Tenant' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledTimes(1);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('My Tenant');
    });

    it('can call next with invalid operation when there is no header or query parameter', async () => {
      const { next } = await run({}, {});

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('does not use the tenant of the session', async () => {
      const { next } = await run({}, {}, { tenantId: tenantId.toString() });

      expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('does not use a query parameter that is not a string', async () => {
      const { next } = await run({}, { tenant: ['a', 'b'] });

      expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('complete sign in', () => {
    const tenant: Tenant = { id: tenantId, name: 'My Tenant', realm: 'realm-1' };

    const run = async (headers: Record<string, string>, session: object = {}, query: object = {}) => {
      const req = { headers, query, session };
      const next = jest.fn();
      await createTenantHandler(tenantServiceMock, 'complete')(req as unknown as Request, {} as Response, next);
      return { req, next };
    };

    it('can get the tenant of the session in which sign in was initiated', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);

      const { req, next } = await run({}, { tenantId: tenantId.toString() });

      expect(tenantServiceMock.getTenant).toHaveBeenCalledWith(expect.any(AdspId));
      expect(req['tenant']).toBe(tenant);
      expect(next).toHaveBeenCalledWith();
    });

    it('can get the tenant from the header rather than the session', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      await run({ 'x-adsp-tenant': 'My Tenant' }, { tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/other' });

      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('My Tenant');
      expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
    });

    it('does not use the query parameter', async () => {
      const { next } = await run({}, {}, { tenant: 'My Tenant' });

      expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation when sign in was not initiated', async () => {
      const { next } = await run({});

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with not found when the tenant of the session no longer exists', async () => {
      tenantServiceMock.getTenant.mockResolvedValueOnce(null);

      const { next } = await run({}, { tenantId: tenantId.toString() });

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('does not change the tenant of the session', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce(tenant);

      const { req } = await run({ 'x-adsp-tenant': 'My Tenant' }, { tenantId: 'original' });

      expect(req.session['tenantId']).toBe('original');
    });
  });

  describe('keepTenantInSession', () => {
    const tenant: Tenant = { id: tenantId, name: 'My Tenant', realm: 'realm-1' };

    it('can keep the tenant of the request in the session', () => {
      const req = { tenant, session: {} };
      const next = jest.fn();

      keepTenantInSession(req as unknown as Request, {} as Response, next);

      expect(req.session['tenantId']).toBe(tenantId.toString());
      expect(next).toHaveBeenCalledWith();
    });

    it('does nothing when the request has no tenant', () => {
      const req = { session: {} };
      const next = jest.fn();

      keepTenantInSession(req as unknown as Request, {} as Response, next);

      expect(req.session['tenantId']).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('does nothing when the request has no session', () => {
      const req = { tenant };
      const next = jest.fn();

      keepTenantInSession(req as unknown as Request, {} as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('the tenant handler', () => {
    it('does not keep the tenant in the session itself', async () => {
      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId, name: 'My Tenant', realm: 'r' });
      const req = { headers: {}, query: { tenant: 'My Tenant' }, session: {} };

      await createTenantHandler(tenantServiceMock, 'initiate')(req as unknown as Request, {} as Response, jest.fn());

      expect(req.session['tenantId']).toBeUndefined();
    });
  });

  describe('resolveTenant', () => {
    it('can resolve a tenant by URN', async () => {
      const tenant: Tenant = { id: tenantId, name: 'Test', realm: 'test' };
      tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);

      expect(await resolveTenant(tenantServiceMock, tenantId.toString())).toBe(tenant);
    });

    it('can resolve nothing for an empty value', async () => {
      expect(await resolveTenant(tenantServiceMock, '')).toBeNull();
      expect(tenantServiceMock.getTenantByName).not.toHaveBeenCalled();
    });
  });
});
