import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Knex } from 'knex';
import { Solution, SolutionCriteria, SolutionRepository, SolutionState } from '../planner';

interface SolutionRecord {
  id: string;
  tenant: string;
  name: string;
  description?: string;
  scenario: string;
  status: Solution['status'];
  createdById: string;
  createdByName: string;
  createdOn: Date;
  updatedOn: Date;
  state: SolutionState;
  revision: number;
}

const mapRecord = (record: SolutionRecord): Solution => ({
  id: record.id,
  tenantId: AdspId.parse(record.tenant),
  name: record.name,
  description: record.description,
  scenario: record.scenario,
  status: record.status,
  createdById: record.createdById,
  createdByName: record.createdByName,
  createdOn: record.createdOn,
  updatedOn: record.updatedOn,
  state: record.state,
  revision: record.revision,
});

const mapSolution = (solution: Solution): SolutionRecord => ({
  id: solution.id,
  tenant: solution.tenantId.toString(),
  name: solution.name,
  description: solution.description,
  scenario: solution.scenario,
  status: solution.status,
  createdById: solution.createdById,
  createdByName: solution.createdByName,
  createdOn: solution.createdOn,
  updatedOn: solution.updatedOn,
  state: solution.state,
  revision: solution.revision,
});

export class PostgresSolutionRepository implements SolutionRepository {
  constructor(private knex: Knex) {}

  async find(top: number, after: string, criteria: SolutionCriteria): Promise<Results<Solution>> {
    const skip = decodeAfter(after);
    const topChecked = top + 1;
    const where: Record<string, unknown> = { tenant: criteria.tenantId.toString() };
    if (criteria.createdById) {
      where.createdById = criteria.createdById;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }

    const rows = await this.knex<SolutionRecord>('solutions')
      .where(where)
      .orderBy('updatedOn', 'desc')
      .offset(skip)
      .limit(topChecked);

    return {
      results: rows.slice(0, top).map(mapRecord),
      page: {
        after,
        next: encodeNext(rows.length, topChecked, skip - 1),
        size: rows.length > top ? top : rows.length,
      },
    };
  }

  async get(tenantId: AdspId, id: string): Promise<Solution | null> {
    const [record] = await this.knex<SolutionRecord>('solutions').where({ tenant: tenantId.toString(), id }).limit(1);
    return record ? mapRecord(record) : null;
  }

  async save(solution: Solution): Promise<Solution> {
    const record = mapSolution(solution);
    const rows = await this.knex<SolutionRecord>('solutions')
      .insert({ ...record, state: JSON.stringify(record.state) as unknown as SolutionState })
      .onConflict('id')
      .merge()
      .where('solutions.revision', record.revision - 1)
      .where('solutions.tenant', record.tenant)
      .returning('*');

    if (rows.length < 1) {
      throw new InvalidOperationError('Solution was modified by another request; reload and retry.');
    }
    return mapRecord(rows[0]);
  }

  async delete(tenantId: AdspId, id: string): Promise<boolean> {
    const count = await this.knex('solutions').where({ tenant: tenantId.toString(), id }).delete();
    return count > 0;
  }
}
