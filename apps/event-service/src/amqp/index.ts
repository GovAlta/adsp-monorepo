import { retry } from '@abgov/adsp-service-sdk';
import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { AmqpDomainEventService } from './service';

interface AmqpEventServiceProps {
  amqpHost: string;
  amqpUser: string;
  amqpPassword: string;
  amqpUrl?: string;
  logger: Logger;
}

export const createEventService = async (props: AmqpEventServiceProps): Promise<AmqpDomainEventService> => {
  const service = await retry.execute(async ({ attempt }) => {
    props.logger.debug(`Try ${attempt}: connecting to RabbitMQ - ${props.amqpHost}...`, {
      context: 'AmqpDomainEventService',
    });

    try {
      const connection = await connect(getConnectionParameters(props));

      const service = new AmqpDomainEventService(props.logger, connection);
      await service.connect();

      return service;
    } catch (err) {
      props.logger.debug(`Try ${attempt} failed with error. ${err}`, { context: 'createEventService' });
      throw err;
    }
  });

  props.logger.info(`Connected to RabbitMQ at: ${props.amqpHost}`, { context: 'AmqpDomainEventService' });
  return service;
};

const getConnectionParameters = (credentials: AmqpEventServiceProps) => {
  return credentials.amqpUrl
    ? // AMQP_URL is used for testing purposes, allowing us to
      // connect to cloud AMQP, for example.
      {
        heartbeat: 160,
        url: credentials.amqpUrl,
      }
    : {
        heartbeat: 160,
        hostname: credentials.amqpHost,
        username: credentials.amqpUser,
        password: credentials.amqpPassword,
      };
};
