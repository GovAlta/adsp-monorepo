import { Knex } from 'knex';
import { EventCriteria, StoredEvent } from '../audit';
import { PostgresEventReader } from './events';

describe('PostgresEventReader', () => {
  const row = { id: 'event-1', tenant_id: 'urn:tenant', namespace: 'ns' } as StoredEvent;

  const builder = {
    where: jest.fn(),
    andWhere: jest.fn(),
    whereRaw: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    first: jest.fn(),
  };
  const knexMock = jest.fn(() => builder) as unknown as Knex;

  beforeEach(() => {
    jest.resetAllMocks();
    (knexMock as unknown as jest.Mock).mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    builder.andWhere.mockReturnValue(builder);
    builder.whereRaw.mockReturnValue(builder);
    builder.orderBy.mockReturnValue(builder);
    builder.limit.mockReturnValue(builder);
    builder.offset.mockResolvedValue([row]);
    builder.first.mockResolvedValue(row);
  });

  const reader = new PostgresEventReader(knexMock);

  describe('find', () => {
    it('can scope to tenant only', async () => {
      const result = await reader.find({ tenantId: 'urn:tenant' }, 10, 0);

      expect(result).toEqual([row]);
      expect(knexMock).toHaveBeenCalledWith('audit_events');
      expect(builder.where).toHaveBeenCalledWith('tenant_id', 'urn:tenant');
      expect(builder.andWhere).not.toHaveBeenCalled();
      expect(builder.whereRaw).not.toHaveBeenCalled();
    });

    it('can order newest first with id tiebreaker and apply paging', async () => {
      await reader.find({ tenantId: 'urn:tenant' }, 7, 14);

      expect(builder.orderBy).toHaveBeenCalledWith([
        { column: 'occurred_at', order: 'desc' },
        { column: 'id', order: 'desc' },
      ]);
      expect(builder.limit).toHaveBeenCalledWith(7);
      expect(builder.offset).toHaveBeenCalledWith(14);
    });

    it.each([
      ['namespace', { namespace: 'ns' }, 'namespace', 'ns'],
      ['actor', { actor: 'user-1' }, 'actor_id', 'user-1'],
      ['resourceType', { resourceType: 'server' }, 'resource_type', 'server'],
      ['resourceId', { resourceId: 'srv-1' }, 'resource_id', 'srv-1'],
      ['action', { action: 'server.update' }, 'action', 'server.update'],
      ['status', { status: 'success' }, 'status', 'success'],
      ['category', { category: 'security' }, 'category', 'security'],
    ] as [string, Partial<EventCriteria>, string, string][])(
      'can filter by %s',
      async (_name, criteria, column, value) => {
        await reader.find({ tenantId: 'urn:tenant', ...criteria }, 10, 0);

        expect(builder.andWhere).toHaveBeenCalledWith(column, value);
      },
    );

    it('can filter by scope membership', async () => {
      await reader.find({ tenantId: 'urn:tenant', scope: 'team-0' }, 10, 0);

      expect(builder.whereRaw).toHaveBeenCalledWith('scope_ids @> ARRAY[?]::text[]', ['team-0']);
    });

    it('can filter by occurred range', async () => {
      const from = new Date('2026-01-01T00:00:00Z');
      const to = new Date('2026-02-01T00:00:00Z');
      await reader.find({ tenantId: 'urn:tenant', occurredFrom: from, occurredTo: to }, 10, 0);

      expect(builder.andWhere).toHaveBeenCalledWith('occurred_at', '>=', from);
      expect(builder.andWhere).toHaveBeenCalledWith('occurred_at', '<=', to);
    });
  });

  describe('get', () => {
    it('can match on tenant, namespace and id', async () => {
      const result = await reader.get('urn:tenant', 'ns', 'event-1');

      expect(result).toBe(row);
      expect(builder.where).toHaveBeenCalledWith({ tenant_id: 'urn:tenant', namespace: 'ns', id: 'event-1' });
    });

    it('can return null when not found', async () => {
      builder.first.mockResolvedValueOnce(undefined);

      const result = await reader.get('urn:tenant', 'ns', 'missing');

      expect(result).toBeNull();
    });
  });
});
