import { WorkQueueService } from '@core-services/core-common';
import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { HealthCheckJobScheduler } from '../jobs/';
import { HealthCheckControllerWorkItem } from './HealthCheckControllerWorkItem';
import { AMQPCredentials, getConnectionProps } from '@core-services/core-common';
import { HealthCheckQueueService } from './HealthCheckQueueService';
import { JobScheduler } from '../jobs/JobScheduler';
import { ApplicationManager } from '../model/applicationManager';

interface HealthCheckControllerProps {
  healthCheckScheduler: HealthCheckJobScheduler;
  applicationManager: ApplicationManager;
  logger: Logger;
}
export class HealthCheckController {
  #applicationManager: ApplicationManager;
  #healthCheckJobScheduler: HealthCheckJobScheduler;
  #scheduler: JobScheduler;
  #logger: Logger;

  constructor(props: HealthCheckControllerProps, scheduler: JobScheduler) {
    this.#logger = props.logger;
    this.#applicationManager = props.applicationManager;
    this.#healthCheckJobScheduler = props.healthCheckScheduler;
    this.#scheduler = scheduler;
  }

  connect = async (credentials: AMQPCredentials): Promise<WorkQueueService<HealthCheckControllerWorkItem>> => {
    const connection = connect(getConnectionProps(credentials, 160));

    const service = new HealthCheckQueueService(connection, this.#logger);
    await service.connect();

    this.#logger.info(`Connected to RabbitMQ as health check controller work queue service`);
    return service;
  };

  subscribe = (queueService: WorkQueueService<HealthCheckControllerWorkItem>): void => {
    queueService.getItems().subscribe(({ item, done }) => {
      switch (item?.work) {
        case 'start':
          this.startApplicationHealthChecks(item);
          done();
          break;
        case 'stop':
          this.stopApplicationHealthChecks(item);
          done();
          break;
        default: {
          done();
          break;
        }
      }
    });
  };

  startApplicationHealthChecks = async (startEvent: HealthCheckControllerWorkItem): Promise<void> => {
    this.#logger.info(`Starting health checks for application ${startEvent.applicationId} at ${startEvent.url}`);
    const app = await this.#applicationManager.getApp(startEvent.applicationId, startEvent.tenantId);
    if (app) {
      this.#healthCheckJobScheduler.startHealthChecks(app, this.#scheduler);
    }
  };

  stopApplicationHealthChecks = async (stopEvent: HealthCheckControllerWorkItem): Promise<void> => {
    this.#logger.info(`Stopping health checks for application ${stopEvent.applicationId} at ${stopEvent.url}`);
    this.#healthCheckJobScheduler.stopHealthChecks(stopEvent.applicationId);
  };
}
