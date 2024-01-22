import axios from 'axios';
import { Form, QueueTaskToProcess } from './form/types';
import { QueueTaskDefinition } from './form/model/queueTask';
import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

export interface QueueTaskService {
  createTaskForQueueTask(url: string, body: QueueTaskDefinition, tenantId: AdspId, form: Form): Promise<any>;
}

const LOG_CONTEXT = { context: 'QueueTaskService' };

export class QueueTaskServiceImpl implements QueueTaskService {
  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async createTaskForQueueTask(url: string, body: QueueTaskDefinition, tenantId: AdspId, form: Form): Promise<any> {
    try {
      const { queueNameSpace, queueName } = form.definition.queueTaskToProcess;
      const token = await this.tokenProvider.getAccessToken();

      const taskServiceUrl = `${url}queues/${queueNameSpace}/${queueName}/tasks?tenantId=${tenantId.toString()}`;
      this.logger.debug(`URL =${taskServiceUrl}, Token = ${token}}`);

      const res = await axios.post(taskServiceUrl, body, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    } catch (err) {
      this.logger.warn(`Error encountered creating a task for form  ${form.id}. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}

export function createQueueTaskService(
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): QueueTaskService {
  return new QueueTaskServiceImpl(logger, directory, tokenProvider);
}
