import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import { Knex } from 'knex';
import { SolutionVersion, SolutionVersionRepository, SolutionVersionSummary } from '../planner/repository';
import { changedSections, contentHash, VersionContent } from '../planner/versioning';

interface SolutionVersionRecord {
  tenant: string;
  solutionId: string;
  number: number;
  name: string;
  createdOn: Date;
  contentHash: string;
  content: VersionContent;
  changedSections: string[];
}

const UNIQUE_VIOLATION = '23505';

const mapRecord = (record: SolutionVersionRecord): SolutionVersion => ({
  number: record.number,
  name: record.name,
  createdOn: record.createdOn,
  contentHash: record.contentHash,
  content: record.content,
  changedSections: record.changedSections ?? [],
});

export class PostgresSolutionVersionRepository implements SolutionVersionRepository {
  constructor(private knex: Knex) {}

  async list(tenantId: AdspId, solutionId: string): Promise<SolutionVersionSummary[]> {
    return (
      await this.knex<SolutionVersionRecord>('solution_versions')
        .select('number', 'name', 'createdOn', 'changedSections')
        .where({ tenant: tenantId.toString(), solutionId })
        .orderBy('number', 'desc')
    ).map((record) => ({ ...record, changedSections: record.changedSections ?? [] }));
  }

  async get(tenantId: AdspId, solutionId: string, number: number): Promise<SolutionVersion | null> {
    const record = await this.knex<SolutionVersionRecord>('solution_versions')
      .where({ tenant: tenantId.toString(), solutionId, number })
      .first();
    return record ? mapRecord(record) : null;
  }

  async latest(tenantId: AdspId, solutionId: string): Promise<SolutionVersion | null> {
    const record = await this.knex<SolutionVersionRecord>('solution_versions')
      .where({ tenant: tenantId.toString(), solutionId })
      .orderBy('number', 'desc')
      .first();
    return record ? mapRecord(record) : null;
  }

  async create(tenantId: AdspId, solutionId: string, content: VersionContent): Promise<SolutionVersion> {
    const tenant = tenantId.toString();
    try {
      return await this.knex.transaction(async (trx) => {
        const previous = await trx<SolutionVersionRecord>('solution_versions')
          .where({ tenant, solutionId })
          .orderBy('number', 'desc')
          .first();
        const number = (previous?.number ?? 0) + 1;
        const [record] = await trx<SolutionVersionRecord>('solution_versions')
          .insert({
            tenant,
            solutionId,
            number,
            name: `Version ${number}`,
            createdOn: new Date(),
            contentHash: contentHash(content),
            content: JSON.stringify(content) as unknown as VersionContent,
            changedSections: JSON.stringify(
              previous ? changedSections(previous.content, content) : [],
            ) as unknown as string[],
          })
          .returning('*');
        await trx('solutions').where({ tenant, id: solutionId }).update({ version: number });
        return mapRecord(record);
      });
    } catch (err) {
      if (err?.code === UNIQUE_VIOLATION) {
        throw new InvalidOperationError('Another version was saved at the same time.', {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }
      throw err;
    }
  }

  async rename(tenantId: AdspId, solutionId: string, number: number, name: string): Promise<SolutionVersion | null> {
    const [record] = await this.knex<SolutionVersionRecord>('solution_versions')
      .where({ tenant: tenantId.toString(), solutionId, number })
      .update({ name })
      .returning('*');
    return record ? mapRecord(record) : null;
  }
}
