import { AdspId, AdspIdFormatError } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { createAnonymousTenantHandler } from './tenant';

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  startBenchmark: jest.fn(() => jest.fn()),
}));

describe('createAnonymousTenantHandler', () => {
  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
  const res = {} as Response;

  beforeEach(() => {
    tenantServiceMock.getTenant.mockReset();
  });

  it('can set tenant for anonymous request with tenantId', async () => {
    const tenant = { id: tenantId, name: 'test' };
    tenantServiceMock.getTenant.mockResolvedValueOnce(tenant);
    const req = { query: { tenantId: tenantId.toString() } } as unknown as Request;
    const next = jest.fn();

    await createAnonymousTenantHandler(tenantServiceMock)(req, res, next);

    expect(tenantServiceMock.getTenant).toHaveBeenCalledWith(expect.objectContaining({ resource: tenantId.resource }));
    expect(req.tenant).toBe(tenant);
    expect(next).toHaveBeenCalledWith();
  });

  it('can pass format error to next for malformed tenantId', async () => {
    const req = { query: { tenantId: 'my-tenant' } } as unknown as Request;
    const next = jest.fn();

    await expect(createAnonymousTenantHandler(tenantServiceMock)(req, res, next)).resolves.toBeUndefined();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AdspIdFormatError));
    expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
  });

  it('can pass format error to next for repeated tenantId', async () => {
    const req = { query: { tenantId: [tenantId.toString(), tenantId.toString()] } } as unknown as Request;
    const next = jest.fn();

    await createAnonymousTenantHandler(tenantServiceMock)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AdspIdFormatError));
    expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
  });

  it('can pass tenant lookup error to next', async () => {
    const error = new Error('oh noes!');
    tenantServiceMock.getTenant.mockRejectedValueOnce(error);
    const req = { query: { tenantId: tenantId.toString() } } as unknown as Request;
    const next = jest.fn();

    await createAnonymousTenantHandler(tenantServiceMock)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('can ignore tenantId when user is present', async () => {
    const req = { user: { id: 'tester' }, query: { tenantId: 'my-tenant' } } as unknown as Request;
    const next = jest.fn();

    await createAnonymousTenantHandler(tenantServiceMock)(req, res, next);

    expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('can skip when no tenantId', async () => {
    const req = { query: {} } as unknown as Request;
    const next = jest.fn();

    await createAnonymousTenantHandler(tenantServiceMock)(req, res, next);

    expect(tenantServiceMock.getTenant).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
