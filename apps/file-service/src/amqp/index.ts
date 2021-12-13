import { WorkQueueService } from '@core-services/core-common';
import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { FileServiceWorkItem } from '../file';
import { AmqpFileQueueService } from './file';

interface FileQueueServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export const createFileQueueService = async ({
  logger,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
}: FileQueueServiceProps): Promise<WorkQueueService<FileServiceWorkItem>> => {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpFileQueueService(logger, connection);
  await service.connect();

  return service;
};

