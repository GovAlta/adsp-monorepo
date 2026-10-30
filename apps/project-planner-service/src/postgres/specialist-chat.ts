import { AdspId } from '@abgov/adsp-service-sdk';
import { Knex } from 'knex';
import { SpecialistChat, SpecialistChatCriteria, SpecialistChatRepository, StoredChatMessage } from '../planner';

interface SpecialistChatRecord {
  id: string;
  tenant: string;
  service: string;
  solutionId?: string;
  title: string;
  createdById: string;
  createdByName: string;
  createdOn: Date;
  updatedOn: Date;
  messages: StoredChatMessage[];
}

// Same ceiling as the largest solution list page the router accepts.
const MAX_CHATS = 100;

const mapRecord = (record: SpecialistChatRecord): SpecialistChat => ({
  id: record.id,
  tenantId: AdspId.parse(record.tenant),
  service: record.service,
  solutionId: record.solutionId || undefined,
  title: record.title,
  createdById: record.createdById,
  createdByName: record.createdByName,
  createdOn: record.createdOn,
  updatedOn: record.updatedOn,
  messages: record.messages,
});

export class PostgresSpecialistChatRepository implements SpecialistChatRepository {
  constructor(private knex: Knex) {}

  async find(criteria: SpecialistChatCriteria): Promise<SpecialistChat[]> {
    const where: Record<string, unknown> = { tenant: criteria.tenantId.toString(), createdById: criteria.createdById };
    if (criteria.service) {
      where.service = criteria.service;
    }
    if (criteria.solutionId) {
      where.solutionId = criteria.solutionId;
    }
    const rows = await this.knex<SpecialistChatRecord>('specialist_chats')
      .where(where)
      .orderBy('updatedOn', 'desc')
      .limit(MAX_CHATS);
    return rows.map(mapRecord);
  }

  // No creator filter or cap: a saved version keeps every chat on the solution.
  async findBySolution(tenantId: AdspId, solutionId: string): Promise<SpecialistChat[]> {
    const rows = await this.knex<SpecialistChatRecord>('specialist_chats')
      .where({ tenant: tenantId.toString(), solutionId })
      .orderBy('createdOn', 'asc');
    return rows.map(mapRecord);
  }

  async get(tenantId: AdspId, id: string): Promise<SpecialistChat | null> {
    const [record] = await this.knex<SpecialistChatRecord>('specialist_chats')
      .where({ tenant: tenantId.toString(), id })
      .limit(1);
    return record ? mapRecord(record) : null;
  }

  async save(chat: SpecialistChat): Promise<SpecialistChat> {
    const [record] = await this.knex('specialist_chats')
      .insert({
        id: chat.id,
        tenant: chat.tenantId.toString(),
        service: chat.service,
        solutionId: chat.solutionId,
        title: chat.title,
        createdById: chat.createdById,
        createdByName: chat.createdByName,
        createdOn: chat.createdOn,
        updatedOn: chat.updatedOn,
        messages: JSON.stringify(chat.messages),
      })
      .onConflict('id')
      .merge(['title', 'updatedOn', 'messages'])
      .returning('*');
    return mapRecord(record);
  }

  async delete(tenantId: AdspId, id: string): Promise<boolean> {
    const count = await this.knex('specialist_chats').where({ tenant: tenantId.toString(), id }).delete();
    return count > 0;
  }
}