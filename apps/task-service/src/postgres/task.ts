import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { Knex } from 'knex';
import { TaskRepository, TaskCriteria, TaskEntity, QueueEntity, TaskMetrics, TaskStatus, TaskPriority } from '../task';
import { TaskAggregationResult, TaskRecord } from './types';

export class PostgresTaskRepository implements TaskRepository {
  constructor(private knex: Knex) {}

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
          data: record.data || {},
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
                assignedTo: record.assignedToId
                  ? {
                      id: record.assignedToId,
                      name: record.assignedToName,
                      email: record.assignedToEmail,
                    }
                  : null,
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
    const topChecked = top + 1;
    let query = this.knex<TaskRecord>('tasks');
    query = query.offset(skip).limit(topChecked);

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
      results: rows.map((r) => this.mapRecord(r, queues)).slice(0, top),
      page: {
        after,
        next: encodeNext(rows.length, topChecked, skip - 1),
        size: rows.length > top ? top : rows.length,
      },
    };
  }

  async getTask(queues: Record<string, QueueEntity>, tenantId: AdspId, id: string): Promise<TaskEntity> {
    const [record] = await this.knex<TaskRecord>('tasks').limit(1).where({ tenant: tenantId.toString(), id });

    return this.mapRecord(record, queues);
  }

  async getTaskMetrics(tenantId: AdspId, criteria?: TaskCriteria): Promise<TaskMetrics[]> {
    const query = this.knex('tasks');

    criteria = {
      ...criteria,
      tenantId,
    };

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

    const results: TaskAggregationResult[] = await query
      .select('queueNamespace', 'queueName', 'status', 'priority', 'assignedToId')
      .count('id')
      .min('assignedToName', { as: 'assignedToName' })
      .groupByRaw(
        this.knex.raw(
          'grouping sets (("queueNamespace", "queueName", "status"), ("queueNamespace", "queueName", "assignedToId"), ("queueNamespace", "queueName", "priority"))'
        )
      );

    const counts = results.reduce((counts, result) => {
      const key = `${result.queueNamespace}:${result.queueName}`;
      if (!counts[key]) {
        counts[key] = {
          namespace: result.queueNamespace,
          name: result.queueName,
          status: {
            [TaskStatus.Pending]: 0,
            [TaskStatus.InProgress]: 0,
            [TaskStatus.Stopped]: 0,
            [TaskStatus.Cancelled]: 0,
            [TaskStatus.Completed]: 0,
          },
          priority: {
            [TaskPriority.Normal]: 0,
            [TaskPriority.High]: 0,
            [TaskPriority.Urgent]: 0,
          },
          assignedTo: {},
        };
      }

      const queueCounts = counts[key];
      if (result.status) {
        queueCounts.status[result.status] = typeof result.count === 'string' ? parseInt(result.count) : result.count;
      }

      if (result.priority) {
        queueCounts.priority[result.priority] =
          typeof result.count === 'string' ? parseInt(result.count) : result.count;
      }

      if (result.assignedToId) {
        queueCounts.assignedTo[result.assignedToId] = {
          id: result.assignedToId,
          name: result.assignedToName,
          count: typeof result.count === 'string' ? parseInt(result.count) : result.count,
        };
      }

      return counts;
    }, {} as Record<string, TaskMetrics>);

    return Object.values(counts);
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
          recordId: entity.recordId?.toString(),
          data: entity.data,
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

  async delete(entity: TaskEntity): Promise<boolean> {
    const result = await this.knex<TaskRecord>('tasks')
      .limit(1)
      .where({ tenant: entity.tenantId.toString(), id: entity.id })
      .delete();

    return result === 1;
  }
}
