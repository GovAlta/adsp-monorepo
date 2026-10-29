import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Knex } from 'knex';
import { contentHash, VersionContent } from '../planner/versioning';
import { PostgresSolutionVersionRepository } from './solution-version';

describe('PostgresSolutionVersionRepository', () => {
  const knexMock = jest.fn() as jest.Mock & { transaction?: jest.Mock };
  const repository = new PostgresSolutionVersionRepository(knexMock as unknown as Knex);

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const tenant = tenantId.toString();
  const content: VersionContent = {
    name: 'Permit intake',
    scenario: 'new',
    status: 'draft',
    state: {
      problemStatement: 'Applicants submit permit forms.',
      concepts: [],
      decisions: [],
      questions: [],
      patternMatches: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
    },
    specialistChats: [],
  };
  const record = {
    tenant,
    solutionId: 'solution-1',
    number: 2,
    name: 'Version 2',
    createdOn: new Date('2026-03-01T00:00:00.000Z'),
    contentHash: 'hash',
    content,
  };
  const version = { number: 2, name: 'Version 2', createdOn: record.createdOn, contentHash: 'hash', content };

  const query = (...methods: string[]) => {
    const mock = Object.fromEntries(methods.map((method) => [method, jest.fn()]));
    for (const method of methods) {
      mock[method].mockReturnValue(mock);
    }
    return mock;
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('lists the solution versions newest first, without their content', async () => {
      const q = query('select', 'where', 'orderBy');
      q.orderBy.mockResolvedValueOnce([{ number: 1, name: 'Version 1', createdOn: record.createdOn }]);
      knexMock.mockReturnValueOnce(q);

      const result = await repository.list(tenantId, 'solution-1');

      expect([q.select.mock.calls[0], q.where.mock.calls[0], q.orderBy.mock.calls[0], result]).toEqual([
        ['number', 'name', 'createdOn'],
        [{ tenant, solutionId: 'solution-1' }],
        ['number', 'desc'],
        [{ number: 1, name: 'Version 1', createdOn: record.createdOn }],
      ]);
    });
  });

  describe('get', () => {
    it('returns the version with that number', async () => {
      const q = query('where', 'first');
      q.first.mockResolvedValueOnce(record);
      knexMock.mockReturnValueOnce(q);

      const result = await repository.get(tenantId, 'solution-1', 2);

      expect([q.where.mock.calls[0], result]).toEqual([[{ tenant, solutionId: 'solution-1', number: 2 }], version]);
    });

    it('returns null when there is no such version', async () => {
      const q = query('where', 'first');
      q.first.mockResolvedValueOnce(undefined);
      knexMock.mockReturnValueOnce(q);

      expect(await repository.get(tenantId, 'solution-1', 9)).toBeNull();
    });
  });

  describe('latest', () => {
    it('returns the highest numbered version', async () => {
      const q = query('where', 'orderBy', 'first');
      q.first.mockResolvedValueOnce(record);
      knexMock.mockReturnValueOnce(q);

      const result = await repository.latest(tenantId, 'solution-1');

      expect([q.orderBy.mock.calls[0], result]).toEqual([['number', 'desc'], version]);
    });

    it('returns null when the solution has no versions', async () => {
      const q = query('where', 'orderBy', 'first');
      q.first.mockResolvedValueOnce(undefined);
      knexMock.mockReturnValueOnce(q);

      expect(await repository.latest(tenantId, 'solution-1')).toBeNull();
    });
  });

  describe('create', () => {
    let maxQuery, insertQuery, solutionQuery, trx: jest.Mock;

    beforeEach(() => {
      maxQuery = query('where', 'max', 'first');
      insertQuery = query('insert', 'returning');
      solutionQuery = query('where', 'update');
      trx = jest.fn().mockReturnValueOnce(maxQuery).mockReturnValueOnce(insertQuery).mockReturnValueOnce(solutionQuery);
      knexMock.transaction = jest.fn((work) => work(trx));
      insertQuery.returning.mockResolvedValueOnce([record]);
    });

    it('numbers the version one past the latest and names it after its number', async () => {
      maxQuery.first.mockResolvedValueOnce({ max: 1 });

      await repository.create(tenantId, 'solution-1', content);

      expect(insertQuery.insert).toHaveBeenCalledWith({
        tenant,
        solutionId: 'solution-1',
        number: 2,
        name: 'Version 2',
        createdOn: expect.any(Date),
        contentHash: contentHash(content),
        content: JSON.stringify(content),
      });
    });

    it('starts at version 1 when the solution has none', async () => {
      maxQuery.first.mockResolvedValueOnce({ max: null });

      await repository.create(tenantId, 'solution-1', content);

      expect(insertQuery.insert.mock.calls[0][0]).toMatchObject({ number: 1, name: 'Version 1' });
    });

    it('records the new number as the solution version in the same transaction', async () => {
      maxQuery.first.mockResolvedValueOnce({ max: 1 });

      await repository.create(tenantId, 'solution-1', content);

      expect([solutionQuery.where.mock.calls[0], solutionQuery.update.mock.calls[0]]).toEqual([
        [{ tenant, id: 'solution-1' }],
        [{ version: 2 }],
      ]);
    });

    it('returns the saved version', async () => {
      maxQuery.first.mockResolvedValueOnce({ max: 1 });

      expect(await repository.create(tenantId, 'solution-1', content)).toEqual(version);
    });

    it('reports a conflict when someone else saved the same number first', async () => {
      maxQuery.first.mockResolvedValueOnce({ max: 1 });
      insertQuery.returning.mockReset().mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }));

      const error = await repository.create(tenantId, 'solution-1', content).catch((err) => err);

      expect([error instanceof InvalidOperationError, error.extra?.statusCode]).toEqual([true, 409]);
    });

    it('rethrows other database errors', async () => {
      maxQuery.first.mockResolvedValueOnce({ max: 1 });
      insertQuery.returning.mockReset().mockRejectedValueOnce(new Error('connection lost'));

      await expect(repository.create(tenantId, 'solution-1', content)).rejects.toThrow('connection lost');
    });
  });

  describe('rename', () => {
    it('updates the name of that version and returns it', async () => {
      const q = query('where', 'update', 'returning');
      q.returning.mockResolvedValueOnce([{ ...record, name: 'Pilot' }]);
      knexMock.mockReturnValueOnce(q);

      const result = await repository.rename(tenantId, 'solution-1', 2, 'Pilot');

      expect([q.where.mock.calls[0], q.update.mock.calls[0], result.name]).toEqual([
        [{ tenant, solutionId: 'solution-1', number: 2 }],
        [{ name: 'Pilot' }],
        'Pilot',
      ]);
    });

    it('returns null when there is no such version', async () => {
      const q = query('where', 'update', 'returning');
      q.returning.mockResolvedValueOnce([]);
      knexMock.mockReturnValueOnce(q);

      expect(await repository.rename(tenantId, 'solution-1', 9, 'Pilot')).toBeNull();
    });
  });
});
