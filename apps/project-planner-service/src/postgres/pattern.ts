import { AdspId } from '@abgov/adsp-service-sdk';
import { Knex } from 'knex';
import { BusinessPattern, PatternRepository } from '../planner';

interface PatternRecord {
  tenant: string;
  id: string;
  pattern: BusinessPattern;
  createdById: string;
  createdByName: string;
  createdOn: Date;
  updatedOn: Date;
}

export class PostgresPatternRepository implements PatternRepository {
  constructor(private knex: Knex) {}

  async find(tenantId: AdspId): Promise<BusinessPattern[]> {
    const rows = await this.knex<PatternRecord>('patterns').where({ tenant: tenantId.toString() }).orderBy('id');
    return rows.map((row) => row.pattern);
  }

  async save(tenantId: AdspId, pattern: BusinessPattern, user: { id: string; name: string }): Promise<BusinessPattern> {
    const now = new Date();
    await this.knex('patterns')
      .insert({
        tenant: tenantId.toString(),
        id: pattern.id,
        pattern: JSON.stringify(pattern),
        createdById: user.id,
        createdByName: user.name,
        createdOn: now,
        updatedOn: now,
      })
      .onConflict(['tenant', 'id'])
      .merge(['pattern', 'updatedOn']);
    return pattern;
  }

  async delete(tenantId: AdspId, id: string): Promise<boolean> {
    const count = await this.knex('patterns').where({ tenant: tenantId.toString(), id }).delete();
    return count > 0;
  }
}