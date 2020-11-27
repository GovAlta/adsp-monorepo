import { connect } from 'amqplib';
import { Logger } from 'winston';
import { WorkQueueService } from '../work';
import { AmqpEventSubscriberService } from './event';
import { AmqpWorkQueueService } from './work';

interface AmqpServiceProps {
  queue: string
  AMQP_HOST: string
  AMQP_USER: string
  AMQP_PASSWORD: string
  logger: Logger
}

export const createAmqpEventService = ({
  queue,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
  logger
}: AmqpServiceProps) => {
  return connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD
  }).then((connection) => {
    const service = new AmqpEventSubscriberService(queue, logger, connection);
    return service.connect()
    .then(() => 
      service
    );
  }).then((service) => {
    logger.info(`Connected to RabbitMQ as event service at: ${AMQP_HOST}`);
    return service;
  });
}

export const createAmqpQueueService = <T>({
  queue,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
  logger
}: AmqpServiceProps): Promise<WorkQueueService<T>> => {
  return connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD
  }).then((connection) => {
    const service = new AmqpWorkQueueService<T>(queue, logger, connection);
    return service.connect()
    .then(() => 
      service
    );
  }).then((service) => {
    logger.info(`Connected to RabbitMQ as work qeue at: ${AMQP_HOST}`);
    return service;
  });
}
