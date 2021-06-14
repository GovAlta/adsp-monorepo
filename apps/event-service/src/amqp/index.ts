import { connect } from 'amqplib';
import { Logger } from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
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
  const service = await retry(async (next, count) => {
    logger.debug(`Try ${count}: connecting to RabbitMQ - ${amqpHost}...`, { context: 'AmqpDomainEventService' });

    try {
      const connection = await connect({
        heartbeat: 160,
        hostname: amqpHost,
        username: amqpUser,
        password: amqpPassword,
      });

      const service = new AmqpDomainEventService(logger, connection);
      await service.connect();

      return service;
    } catch (err) {
      logger.debug(`Try ${count} failed with error. ${err}`, { context: 'createEventService' });
      next(err);
    }
  });

  logger.info(`Connected to RabbitMQ at: ${amqpHost}`, { context: 'AmqpDomainEventService' });
  return service;
};
