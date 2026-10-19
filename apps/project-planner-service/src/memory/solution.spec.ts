import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Solution } from '../planner';
import { MemorySolutionRepository } from './solution';

describe('MemorySolutionRepository', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/alberta-health`;

  const createSolution = (overrides: Partial<Solution> = {}): Solution =>
    ({
      id: 'grant-intake',
      tenantId,
      name: 'Grant intake',
      scenario: 'intake',
      status: 'draft',
      createdById: 'user-1',
      createdByName: 'Pat Planner',
      createdOn: new Date('2026-10-01T00:00:00Z'),
      updatedOn: new Date('2026-10-01T00:00:00Z'),
      ...overrides,
    }) as Solution;

  let repository: MemorySolutionRepository;

  beforeEach(() => {
    repository = new MemorySolutionRepository();
  });

  it('returns null for an unknown solution', async () => {
    const result = await repository.get(tenantId, 'missing');

    expect(result).toBeNull();
  });

  it('returns a saved solution by tenant and id', async () => {
    const solution = createSolution();
    await repository.save(solution);

    const result = await repository.get(tenantId, solution.id);

    expect(result).toBe(solution);
  });

  it('does not return a solution saved for another tenant', async () => {
    await repository.save(createSolution({ tenantId: otherTenantId }));

    const result = await repository.get(tenantId, 'grant-intake');

    expect(result).toBeNull();
  });

  it('saves an update to an existing solution', async () => {
    await repository.save(createSolution());

    const result = await repository.save(createSolution({ name: 'Renamed' }));

    expect(result.name).toBe('Renamed');
  });

  it('rejects saving over a solution id owned by another tenant', async () => {
    await repository.save(createSolution({ tenantId: otherTenantId }));

    await expect(repository.save(createSolution())).rejects.toThrow(InvalidOperationError);
  });

  it('deletes a saved solution', async () => {
    await repository.save(createSolution());

    const result = await repository.delete(tenantId, 'grant-intake');

    expect(result).toBe(true);
  });

  it('does not delete a solution owned by another tenant', async () => {
    await repository.save(createSolution({ tenantId: otherTenantId }));

    const result = await repository.delete(tenantId, 'grant-intake');

    expect(result).toBe(false);
  });

  it('reports false when deleting an unknown solution', async () => {
    const result = await repository.delete(tenantId, 'missing');

    expect(result).toBe(false);
  });

  it('finds solutions for the tenant only, newest first', async () => {
    await repository.save(createSolution({ id: 'older', updatedOn: new Date('2026-10-01T00:00:00Z') }));
    await repository.save(createSolution({ id: 'newer', updatedOn: new Date('2026-10-05T00:00:00Z') }));
    await repository.save(createSolution({ id: 'other', tenantId: otherTenantId }));

    const { results } = await repository.find(10, undefined, { tenantId });

    expect(results.map((s) => s.id)).toEqual(['newer', 'older']);
  });

  it('filters solutions by creator', async () => {
    await repository.save(createSolution({ id: 'mine', createdById: 'user-1' }));
    await repository.save(createSolution({ id: 'theirs', createdById: 'user-2' }));

    const { results } = await repository.find(10, undefined, { tenantId, createdById: 'user-2' });

    expect(results.map((s) => s.id)).toEqual(['theirs']);
  });

  it('filters solutions by status', async () => {
    await repository.save(createSolution({ id: 'draft-one', status: 'draft' }));
    await repository.save(createSolution({ id: 'done-one', status: 'completed' }));

    const { results } = await repository.find(10, undefined, { tenantId, status: 'completed' });

    expect(results.map((s) => s.id)).toEqual(['done-one']);
  });

  it('returns a next cursor when more solutions remain', async () => {
    await repository.save(createSolution({ id: 'first', updatedOn: new Date('2026-10-02T00:00:00Z') }));
    await repository.save(createSolution({ id: 'second', updatedOn: new Date('2026-10-01T00:00:00Z') }));

    const { page } = await repository.find(1, undefined, { tenantId });

    expect(page).toEqual({ after: undefined, next: Buffer.from('1').toString('base64'), size: 1 });
  });

  it('returns the following page when given an after cursor', async () => {
    await repository.save(createSolution({ id: 'first', updatedOn: new Date('2026-10-02T00:00:00Z') }));
    await repository.save(createSolution({ id: 'second', updatedOn: new Date('2026-10-01T00:00:00Z') }));

    const { results, page } = await repository.find(1, Buffer.from('1').toString('base64'), { tenantId });

    expect(results.map((s) => s.id)).toEqual(['second']);
    expect(page.next).toBeUndefined();
  });

  it('does not return a next cursor when the page is exactly full', async () => {
    await repository.save(createSolution({ id: 'only' }));

    const { page } = await repository.find(1, undefined, { tenantId });

    expect(page).toEqual({ after: undefined, next: undefined, size: 1 });
  });

  it('starts from the beginning when the after cursor is not numeric', async () => {
    await repository.save(createSolution());

    const { results } = await repository.find(10, Buffer.from('not-a-number').toString('base64'), { tenantId });

    expect(results).toHaveLength(1);
  });
});
