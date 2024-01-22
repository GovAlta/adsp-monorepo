import axios from 'axios';
import { Form } from './form/types';
import { QueueTaskDefinition } from './form/model/queueTask';
import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

export interface QueueTaskService {
  createTaskForQueueTask(body: QueueTaskDefinition, tenantId: AdspId, form: Form): Promise<any>;
}

const LOG_CONTEXT = { context: 'QueueTaskService' };

export class QueueTaskServiceImpl implements QueueTaskService {
  directory: ServiceDirectory;

  constructor(private logger: Logger, public serviceDirectory: ServiceDirectory, private tokenProvider: TokenProvider) {
    this.directory = serviceDirectory;
  }

  async createTaskForQueueTask(body: QueueTaskDefinition, tenantId: AdspId, form: Form): Promise<any> {
    try {
      const directoryServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:task-service`);

      const { queueNameSpace, queueName } = form.definition.queueTaskToProcess;
      const token = await this.tokenProvider.getAccessToken();
      const taskServiceUrl = `${directoryServiceUrl}task/v1/queues/${queueNameSpace}/${queueName}/tasks?tenantId=${tenantId.toString()}`;

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
