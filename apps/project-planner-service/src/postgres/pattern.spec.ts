import { adspId } from '@abgov/adsp-service-sdk';
import { Knex } from 'knex';
import { BusinessPattern } from '../planner';
import { PostgresPatternRepository } from './pattern';

describe('PostgresPatternRepository', () => {
  const knexMock = jest.fn();
  const repository = new PostgresPatternRepository(knexMock as unknown as Knex);

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'admin-1', name: 'Alex Admin' };
  const pattern: BusinessPattern = {
    id: 'land-title',
    name: 'Land Title',
    description: 'Registering parcels of land.',
    domainLanguage: ['parcel', 'conveyance'],
    commonFeatures: ['title search'],
    strongSignals: [{ description: 'Titles are registered against parcels', keywords: ['parcel', 'title'] }],
    weakSignals: [],
    serviceMappings: [{ service: 'form-service', reason: 'Capture registration applications.' }],
    clarifyingQuestions: ['Who may register a title?'],
    assumptions: [],
    knownUnknowns: [],
  };

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  describe('find', () => {
    const queryMock = { where: jest.fn(), orderBy: jest.fn() };

    beforeEach(() => {
      queryMock.where.mockReturnValue(queryMock);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('queries the patterns table', async () => {
      queryMock.orderBy.mockResolvedValueOnce([]);

      await repository.find(tenantId);

      expect(knexMock).toHaveBeenCalledWith('patterns');
    });

    it('filters by tenant', async () => {
      queryMock.orderBy.mockResolvedValueOnce([]);

      await repository.find(tenantId);

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString() });
    });

    it('orders by pattern id', async () => {
      queryMock.orderBy.mockResolvedValueOnce([]);

      await repository.find(tenantId);

      expect(queryMock.orderBy).toHaveBeenCalledWith('id');
    });

    it('returns the stored pattern documents', async () => {
      queryMock.orderBy.mockResolvedValueOnce([{ tenant: tenantId.toString(), id: pattern.id, pattern }]);

      const result = await repository.find(tenantId);

      expect(result).toEqual([pattern]);
    });

    it('returns an empty list when the tenant has no stored patterns', async () => {
      queryMock.orderBy.mockResolvedValueOnce([]);

      const result = await repository.find(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    const queryMock = { insert: jest.fn(), onConflict: jest.fn(), merge: jest.fn() };

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(now);
      queryMock.insert.mockReturnValue(queryMock);
      queryMock.onConflict.mockReturnValue(queryMock);
      queryMock.merge.mockResolvedValue(undefined);
      knexMock.mockReturnValueOnce(queryMock);
    });

    it('inserts the record with the pattern serialized as JSON', async () => {
      await repository.save(tenantId, pattern, user);

      expect(queryMock.insert).toHaveBeenCalledWith({
        tenant: tenantId.toString(),
        id: 'land-title',
        pattern: JSON.stringify(pattern),
        createdById: 'admin-1',
        createdByName: 'Alex Admin',
        createdOn: now,
        updatedOn: now,
      });
    });

    it('upserts on tenant and id', async () => {
      await repository.save(tenantId, pattern, user);

      expect(queryMock.onConflict).toHaveBeenCalledWith(['tenant', 'id']);
    });

    it('only replaces the pattern and update time on conflict', async () => {
      await repository.save(tenantId, pattern, user);

      expect(queryMock.merge).toHaveBeenCalledWith(['pattern', 'updatedOn']);
    });

    it('returns the saved pattern', async () => {
      const result = await repository.save(tenantId, pattern, user);

      expect(result).toBe(pattern);
    });

    it('propagates database failures', async () => {
      queryMock.merge.mockRejectedValueOnce(new Error('connection refused'));

      await expect(repository.save(tenantId, pattern, user)).rejects.toThrow('connection refused');
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

      await repository.delete(tenantId, 'land-title');

      expect(queryMock.where).toHaveBeenCalledWith({ tenant: tenantId.toString(), id: 'land-title' });
    });

    it('returns true when a row was deleted', async () => {
      queryMock.delete.mockResolvedValueOnce(1);

      const result = await repository.delete(tenantId, 'land-title');

      expect(result).toBe(true);
    });

    it('returns false when no row was deleted', async () => {
      queryMock.delete.mockResolvedValueOnce(0);

      const result = await repository.delete(tenantId, 'missing');

      expect(result).toBe(false);
    });
  });
});
