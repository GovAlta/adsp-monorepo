import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import * as knex from 'knex';
import { TaskRepository, TaskCriteria, TaskEntity, QueueEntity } from '../task';
import { TaskRecord } from './types';

export class PostgresTaskRepository implements TaskRepository {
  constructor(private knex: knex) {}

  private mapRecord(record: TaskRecord, queues: Record<string, QueueEntity>): TaskEntity {
    return record
      ? new TaskEntity(this, queues[`${record.queueNamespace}:${record.queueName}`], {
          tenantId: AdspId.parse(record.tenant),
          id: record.id,
          name: record.name,
          description: record.description,
          queue: {
            namespace: record.queueNamespace,
            name: record.queueName,
          },
          definition: record.definitionNamespace
            ? {
                namespace: record.definitionNamespace,
                name: record.definitionName,
              }
            : null,
          context: record.context || {},
          recordId: record.recordId,
          priority: record.priority,
          status: record.status,
          createdOn: record.createdOn,
          startedOn: record.startedOn,
          endedOn: record.endedOn,
          assignment: record.assignedById
            ? {
                assignedBy: {
                  id: record.assignedById,
                  name: record.assignedByName,
                },
                assignedTo: {
                  id: record.assignedToId,
                  name: record.assignedByName,
                  email: record.assignedToEmail,
                },
                assignedOn: record.assignedOn,
              }
            : null,
        })
      : null;
  }

  async getTasks(
    queues: Record<string, QueueEntity>,
    top: number,
    after?: string,
    criteria?: TaskCriteria
  ): Promise<Results<TaskEntity>> {
    const skip = decodeAfter(after);

    let query = this.knex<TaskRecord>('tasks');
    query = query.offset(skip).limit(top);

    if (criteria) {
      const queryCriteria: Record<string, unknown> = {};
      if (criteria.tenantId) {
        queryCriteria.tenant = criteria.tenantId.toString();
      }

      if (criteria.queue) {
        queryCriteria.queueNamespace = criteria.queue.namespace;
        queryCriteria.queueName = criteria.queue.name;
      }

      if (criteria.definition) {
        queryCriteria.definitionNamespace = criteria.definition.namespace;
        queryCriteria.definitionName = criteria.definition.name;
      }

      query.where(queryCriteria);

      if (criteria.notEnded) {
        query.whereNull('endedOn');
      }

      if (criteria.context) {
        query.whereRaw(`context @> ?::jsonb`, [JSON.stringify(criteria.context)]);
      }
    }

    const rows = await query.orderBy('priority', 'desc').orderBy('createdOn', 'asc');

    return {
      results: rows.map((r) => this.mapRecord(r, queues)),
      page: {
        after,
        next: encodeNext(rows.length, top, skip),
        size: rows.length,
      },
    };
  }

  async getTask(queues: Record<string, QueueEntity>, tenantId: AdspId, id: string): Promise<TaskEntity> {
    const [record] = await this.knex<TaskRecord>('tasks').limit(1).where({ tenant: tenantId.toString(), id });

    return this.mapRecord(record, queues);
  }

  async save(entity: TaskEntity): Promise<TaskEntity> {
    const record = await this.knex.transaction(async (ts) => {
      const [row] = await ts<TaskRecord>('tasks')
        .insert({
          tenant: entity.tenantId.toString(),
          id: entity.id,
          queueNamespace: entity.queue?.namespace,
          queueName: entity.queue?.name,
          definitionNamespace: entity.definition?.namespace,
          definitionName: entity.definition?.name,
          context: entity.context,
          recordId: entity.recordId,
          name: entity.name,
          description: entity.description,
          priority: entity.priority,
          status: entity.status,
          createdOn: entity.createdOn,
          startedOn: entity.startedOn,
          endedOn: entity.endedOn,
          assignedById: entity.assignment?.assignedBy?.id,
          assignedByName: entity.assignment?.assignedBy?.name,
          assignedOn: entity.assignment?.assignedOn,
          assignedToId: entity.assignment?.assignedTo?.id,
          assignedToName: entity.assignment?.assignedTo?.name,
          assignedToEmail: entity.assignment?.assignedTo?.email,
        })
        .onConflict('id')
        .merge()
        .returning('*');

      return row;
    });

    return this.mapRecord(record, { [`${entity.queue.namespace}:${entity.queue.name}`]: entity.queue });
  }
}
