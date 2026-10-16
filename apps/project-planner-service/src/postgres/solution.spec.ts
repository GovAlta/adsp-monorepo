import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Knex } from 'knex';
import { Solution, SolutionState } from '../planner';
import { PostgresSolutionRepository } from './solution';

describe('PostgresSolutionRepository', () => {
  const knexMock = jest.fn();
  const repository = new PostgresSolutionRepository(knexMock as unknown as Knex);

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const state: SolutionState = {
    problemStatement: 'Applicants submit permit forms.',
    concepts: [],
    decisions: [],
    questions: [],
    patternMatches: [],
    hypotheses: [],
    specialists: [],
    artifacts: [],
    nextSteps: [],
  };
  const record = {
    id: 'solution-1',
    tenant: tenantId.toString(),
    name: 'Permit intake',
    description: 'Permit application intake',
    scenario: 'new',
    status: 'draft' as const,
    createdById: 'planner-1',
    createdByName: 'Pat Planner',
    createdOn: new Date('2026-01-01'),
    updatedOn: new Date('2026-01-02'),
    state,
    revision: 1,
  };
  const solution: Solution = {
    id: record.id,
    tenantId,
    name: record.name,
    description: record.description,
    scenario: record.scenario,
    status: record.status,
    createdById: record.createdById,
    createdByName: record.createdByName,
    createdOn: record.createdOn,
    updatedOn: record.updatedOn,
    state,
    revision: 1,
  };

  const plain = (s: Solution) => ({ ...s, tenantId: s.tenantId.toString() });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('find', () => {
    const queryMock = {
      where: jest.fn(),
      orderBy: jest.fn(),
      offset: jest.fn(),
      limit: jest.fn(),
    };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      queryMock.orderBy.mockReturnValue(queryMock);
      queryMock.offset.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('queries the solutions table filtered by tenant', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      await repository.find(10, null, { tenantId });

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString() });
    });

    it('filters by creator and status when provided', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      await repository.find(10, null, { tenantId, createdById: 'planner-1', status: 'analyzed' });

      expect(queryMock.where).toHaveBeenCalledWith({
        tenant: tenantId.toString(),
        createdById: 'planner-1',
        status: 'analyzed',
      });
    });

    it('orders by most recently updated and fetches one extra row to detect another page', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      await repository.find(10, null, { tenantId });

      expect([queryMock.orderBy.mock.calls[0], queryMock.limit.mock.calls[0]]).toEqual([
        ['updatedOn', 'desc'],
        [11],
      ]);
    });

    it('maps records to solutions', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      const result = await repository.find(10, null, { tenantId });

      expect(plain(result.results[0])).toEqual(plain(solution));
    });

    it('reports the page size when there are no further results', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      const result = await repository.find(10, null, { tenantId });

      expect(result.page.size).toBe(1);
    });

    it('has no next page cursor when there are no further results', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      const result = await repository.find(10, null, { tenantId });

      expect(result.page.next).toBeFalsy();
    });

    it('trims the extra row and returns a next cursor when more results exist', async () => {
      queryMock.limit.mockResolvedValueOnce([record, { ...record, id: 'solution-2' }]);

      const result = await repository.find(1, null, { tenantId });

      expect([result.results.length, result.page.size, !!result.page.next]).toEqual([1, 1, true]);
    });

    it('skips rows according to the after cursor', async () => {
      queryMock.limit.mockResolvedValueOnce([]);

      await repository.find(10, 'MTA', { tenantId });

      expect(queryMock.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('get', () => {
    const queryMock = { where: jest.fn(), limit: jest.fn() };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('queries by tenant and id', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      await repository.get(tenantId, 'solution-1');

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString(), id: 'solution-1' });
    });

    it('returns the mapped solution', async () => {
      queryMock.limit.mockResolvedValueOnce([record]);

      const result = await repository.get(tenantId, 'solution-1');

      expect(plain(result)).toEqual(plain(solution));
    });

    it('returns null when the solution does not exist', async () => {
      queryMock.limit.mockResolvedValueOnce([]);

      const result = await repository.get(tenantId, 'missing');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    const queryMock = {
      insert: jest.fn(),
      onConflict: jest.fn(),
      merge: jest.fn(),
      where: jest.fn(),
      returning: jest.fn(),
    };

    beforeEach(() => {
      queryMock.insert.mockReturnValue(queryMock);
      queryMock.onConflict.mockReturnValue(queryMock);
      queryMock.merge.mockReturnValue(queryMock);
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('inserts the record with state serialized as JSON', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(solution);

      expect(queryMock.insert).toHaveBeenCalledWith({ ...record, state: JSON.stringify(state) });
    });

    it('upserts on id', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(solution);

      expect(queryMock.onConflict).toHaveBeenCalledWith('id');
    });

    it('only merges when the stored revision is the previous revision', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save({ ...solution, revision: 3 });

      expect(queryMock.where).toHaveBeenCalledWith('solutions.revision', 2);
    });

    it('only merges within the same tenant', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      await repository.save(solution);

      expect(queryMock.where).toHaveBeenCalledWith('solutions.tenant', tenantId.toString());
    });

    it('returns the saved solution', async () => {
      queryMock.returning.mockResolvedValueOnce([record]);

      const result = await repository.save(solution);

      expect(plain(result)).toEqual(plain(solution));
    });

    it('throws InvalidOperationError when no row was written due to a revision conflict', async () => {
      queryMock.returning.mockResolvedValueOnce([]);

      await expect(repository.save(solution)).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('delete', () => {
    const queryMock = { where: jest.fn(), delete: jest.fn() };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('deletes by tenant and id', async () => {
      queryMock.delete.mockResolvedValueOnce(1);

      await repository.delete(tenantId, 'solution-1');

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString(), id: 'solution-1' });
    });

    it('returns true when a row was deleted', async () => {
      queryMock.delete.mockResolvedValueOnce(1);

      const result = await repository.delete(tenantId, 'solution-1');

      expect(result).toBe(true);
    });

    it('returns false when no row was deleted', async () => {
      queryMock.delete.mockResolvedValueOnce(0);

      const result = await repository.delete(tenantId, 'missing');

      expect(result).toBe(false);
    });
  });
});
