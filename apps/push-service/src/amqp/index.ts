import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { AmqpEventSubscriberService } from './event';

interface AmqpServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export async function createAmqpEventService({
  logger,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
}: AmqpServiceProps): Promise<AmqpEventSubscriberService> {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpEventSubscriberService(logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as event service at: ${AMQP_HOST}`);
  return service;
}
