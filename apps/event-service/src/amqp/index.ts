import { connect } from 'amqplib';
import { Logger } from 'winston';
import { AmqpDomainEventService } from './service';

interface AmqpEventServiceProps {
  amqpHost: string;
  amqpUser: string;
  amqpPassword: string;
  logger: Logger;
}

export const createEventService = async ({
  amqpHost,
  amqpUser,
  amqpPassword,
  logger,
}: AmqpEventServiceProps): Promise<AmqpDomainEventService> => {
  const connection = await connect({
    heartbeat: 160,
    hostname: amqpHost,
    username: amqpUser,
    password: amqpPassword,
  });

  const service = new AmqpDomainEventService(logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ at: ${amqpHost}`);
  return service;
};
