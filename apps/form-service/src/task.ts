import { AdspId, ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { Form, FormEntity, FormSubmission, FormSubmissionEntity } from './form';
import { InvalidOperationError, New } from '@core-services/core-common';

export interface Task {
  id: string;
  name: string;
  description: string;
  recordId?: string;
}

export interface QueueTaskService {
  createTask(form: FormEntity, submission: FormSubmissionEntity): Promise<Task>;
}

const LOG_CONTEXT = { context: 'QueueTaskService' };

const TASK_SERVICE_ID = adspId`urn:ads:platform:task-service`;
export class QueueTaskServiceImpl implements QueueTaskService {
  directory: ServiceDirectory;

  constructor(
    private serviceId: AdspId,
    private logger: Logger,
    public serviceDirectory: ServiceDirectory,
    private tokenProvider: TokenProvider
  ) {
    this.directory = serviceDirectory;
  }

  private createQueueTaskDefinition(form: Form, submission: FormSubmission): New<Task> {
    return {
      name: 'Process form submission',
      description: `Process form '${form.definition?.name}' (ID: ${form.id}) submission: (${submission.id})`,
      recordId: `${this.serviceId}:v1:/forms/${form.id}/submissions/${submission.id}`,
    };
  }

  async createTask(form: FormEntity, submission: FormSubmissionEntity): Promise<Task> {
    const tenantId = form.tenantId;
    try {
      const directoryServiceUrl = await this.directory.getServiceUrl(TASK_SERVICE_ID);

      const { queueNameSpace, queueName } = form.definition?.queueTaskToProcess || {};
      if (!queueNameSpace || !queueName) {
        throw new InvalidOperationError('Cannot create task for submission of form without processing queue.');
      }

      const token = await this.tokenProvider.getAccessToken();
      const taskServiceUrl = `${directoryServiceUrl}task/v1/queues/${queueNameSpace}/${queueName}/tasks`;

      const task = this.createQueueTaskDefinition(form, submission);
      const { data } = await axios.post<Task>(taskServiceUrl, task, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: tenantId.toString() },
      });

      return data;
    } catch (err) {
      this.logger.warn(`Error encountered creating a task for form  ${form.id}. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}

export function createQueueTaskService(
  serviceId: AdspId,
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): QueueTaskService {
  return new QueueTaskServiceImpl(serviceId, logger, directory, tokenProvider);
}
