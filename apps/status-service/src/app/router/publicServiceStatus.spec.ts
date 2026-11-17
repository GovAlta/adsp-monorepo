import { adspId, TenantService } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { getApplicationsByName } from './publicServiceStatus';
import { ServiceStatusRepository } from '../repository/serviceStatus';

describe('getApplicationsByName', () => {
  const logger = { info: jest.fn(), error: jest.fn() } as unknown as Logger;
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
  const tenantService = {
    getTenants: jest.fn().mockResolvedValue([
      { id: tenantA, name: 'Tenant A' },
      { id: tenantB, name: 'Tenant B' },
    ]),
  } as unknown as TenantService;
  const statuses = [
    { appKey: 'portal', tenantId: tenantA.toString(), status: 'operational' },
    { appKey: 'portal', tenantId: tenantB.toString(), status: 'outage' },
  ];
  const serviceStatusRepository = {
    find: jest.fn(async (filter: { tenantId: string }) => statuses.filter((s) => s.tenantId === filter.tenantId)),
  } as unknown as ServiceStatusRepository;

  it('returns the status of the requested tenant when another tenant has the same appKey', async () => {
    const req = {
      params: { name: 'tenant b' },
      getConfiguration: jest.fn().mockResolvedValue({ portal: { appKey: 'portal', name: 'Portal', url: 'https://portal.example' } }),
    } as unknown as Request;
    const res = { json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    await getApplicationsByName(logger, tenantService, serviceStatusRepository)(req, res, next);

    expect(serviceStatusRepository.find).toHaveBeenCalledWith({
      appKey: { $in: ['portal'] },
      tenantId: tenantB.toString(),
    });
    expect(res.json).toHaveBeenCalledWith([expect.objectContaining({ id: 'portal', status: 'outage' })]);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes NotFoundError for an unknown tenant', async () => {
    const req = { params: { name: 'nope' } } as unknown as Request;
    const next = jest.fn();

    await getApplicationsByName(logger, tenantService, serviceStatusRepository)(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('tenant') }));
  });
});
