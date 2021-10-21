import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import type { WorkQueueService } from '../work';
import { AmqpConfigurationUpdateSubscriberService, ConfigurationUpdate } from './configuration';
import { AmqpEventSubscriberService } from './event';
import { AmqpWorkQueueService } from './work';

interface AmqpServiceProps {
  queue: string;
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export const createAmqpEventService = async ({
  queue,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
  logger,
}: AmqpServiceProps): Promise<AmqpEventSubscriberService> => {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpEventSubscriberService(queue, logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as event service at: ${AMQP_HOST}`);
  return service;
};

export const createAmqpQueueService = async <T>({
  queue,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
  logger,
}: AmqpServiceProps): Promise<WorkQueueService<T>> => {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpWorkQueueService<T>(queue, logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as work queue at: ${AMQP_HOST}`);
  return service;
};

export const createAmqpConfigUpdateService = async ({
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
  logger,
}: Omit<AmqpServiceProps, 'queue'>): Promise<WorkQueueService<ConfigurationUpdate>> => {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpConfigurationUpdateSubscriberService(logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as configuration update service at: ${AMQP_HOST}`);
  return service;
};

export { AmqpEventSubscriberService } from './event';
export type { ConfigurationUpdate } from './configuration';
