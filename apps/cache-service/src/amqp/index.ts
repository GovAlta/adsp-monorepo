import { connect } from 'amqp-connection-manager';
import type { Logger } from 'winston';
import { AmqpCacheQueueService } from './queue';

interface CacheQueueServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export async function createCacheQueueService({ logger, AMQP_HOST, AMQP_USER, AMQP_PASSWORD }: CacheQueueServiceProps) {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpCacheQueueService(logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as cache work queue service at: ${AMQP_HOST}`);
  return service;
}
