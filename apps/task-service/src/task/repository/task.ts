import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { QueueEntity, TaskEntity } from '../model';
import { TaskMetrics, TaskCriteria } from '../types';

export interface TaskRepository {
  getTasks(
    queues: Record<string, QueueEntity>,
    top: number,
    after?: string,
    criteria?: TaskCriteria
  ): Promise<Results<TaskEntity>>;
  getTask(queues: Record<string, QueueEntity>, tenantId: AdspId, id: string): Promise<TaskEntity>;
  getTaskMetrics(tenantId: AdspId, criteria?: TaskCriteria): Promise<TaskMetrics[]>;
  save(entity: TaskEntity): Promise<TaskEntity>;
  delete(entity: TaskEntity): Promise<boolean>;
}
