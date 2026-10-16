import { adspId } from '@abgov/adsp-service-sdk';
import type { BusinessPattern } from '../planner';
import { MemoryPatternRepository } from './pattern';

describe('MemoryPatternRepository', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/alberta-health`;
  const pattern = { id: 'application-intake', name: 'Application intake' } as BusinessPattern;
  const user = { id: 'user-1', name: 'Pat Planner' };

  let repository: MemoryPatternRepository;

  beforeEach(() => {
    repository = new MemoryPatternRepository();
  });

  it('finds saved patterns for the tenant', async () => {
    await repository.save(tenantId, pattern, user);

    const result = await repository.find(tenantId);

    expect(result).toEqual([pattern]);
  });

  it('does not find patterns saved for another tenant', async () => {
    await repository.save(otherTenantId, pattern, user);

    const result = await repository.find(tenantId);

    expect(result).toEqual([]);
  });

  it('finds patterns ordered by id', async () => {
    const later = { id: 'permit-renewal', name: 'Permit renewal' } as BusinessPattern;
    await repository.save(tenantId, later, user);
    await repository.save(tenantId, pattern, user);

    const result = await repository.find(tenantId);

    expect(result.map((p) => p.id)).toEqual(['application-intake', 'permit-renewal']);
  });

  it('replaces a pattern saved again with the same id', async () => {
    const renamed = { ...pattern, name: 'Renamed intake' } as BusinessPattern;
    await repository.save(tenantId, pattern, user);
    await repository.save(tenantId, renamed, user);

    const result = await repository.find(tenantId);

    expect(result).toEqual([renamed]);
  });

  it('returns the saved pattern from save', async () => {
    const result = await repository.save(tenantId, pattern, user);

    expect(result).toBe(pattern);
  });

  it('deletes a saved pattern', async () => {
    await repository.save(tenantId, pattern, user);

    const result = await repository.delete(tenantId, pattern.id);

    expect(result).toBe(true);
  });

  it('reports false when deleting an unknown pattern', async () => {
    const result = await repository.delete(tenantId, 'missing');

    expect(result).toBe(false);
  });
});
