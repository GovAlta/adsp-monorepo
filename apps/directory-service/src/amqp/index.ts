import { connect } from 'amqp-connection-manager';
import type { Logger } from 'winston';
import { AmqpDirectoryQueueService } from './queue';

interface DirectoryQueueServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export async function createDirectoryQueueService({
  logger,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
}: DirectoryQueueServiceProps) {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpDirectoryQueueService(logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as directory work queue service at: ${AMQP_HOST}`);
  return service;
}
