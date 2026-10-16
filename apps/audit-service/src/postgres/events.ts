import { Knex } from 'knex';
import { EventCriteria, EventReader, StoredEvent } from '../audit';

const TABLE = 'audit_events';

export class PostgresEventReader implements EventReader {
  constructor(private knex: Knex) {}

  async find(criteria: EventCriteria, top: number, skip: number): Promise<StoredEvent[]> {
    const builder = this.knex<StoredEvent>(TABLE).where('tenant_id', criteria.tenantId);

    if (criteria.namespace) builder.andWhere('namespace', criteria.namespace);
    if (criteria.actor) builder.andWhere('actor_id', criteria.actor);
    if (criteria.resourceType) builder.andWhere('resource_type', criteria.resourceType);
    if (criteria.resourceId) builder.andWhere('resource_id', criteria.resourceId);
    if (criteria.action) builder.andWhere('action', criteria.action);
    if (criteria.status) builder.andWhere('status', criteria.status);
    if (criteria.category) builder.andWhere('category', criteria.category);
    if (criteria.scope) builder.whereRaw('scope_ids @> ARRAY[?]::text[]', [criteria.scope]);
    if (criteria.occurredFrom) builder.andWhere('occurred_at', '>=', criteria.occurredFrom);
    if (criteria.occurredTo) builder.andWhere('occurred_at', '<=', criteria.occurredTo);

    return await builder
      .orderBy([
        { column: 'occurred_at', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
      .limit(top)
      .offset(skip);
  }

  async get(tenantId: string, namespace: string, id: string): Promise<StoredEvent | null> {
    const row = await this.knex<StoredEvent>(TABLE).where({ tenant_id: tenantId, namespace, id }).first();
    return row ?? null;
  }
}
