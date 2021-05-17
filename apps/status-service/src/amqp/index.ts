import { connect } from 'amqplib';
import { Logger } from 'winston';
import { AmqpDomainEventService } from './service';

interface AmqpEventServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export const createEventService = ({ AMQP_HOST, AMQP_USER, AMQP_PASSWORD, logger }: AmqpEventServiceProps) => {
  return connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  })
    .then((connection) => new AmqpDomainEventService(logger, connection))
    .then((service) => service.connect())
    .then((service) => {
      logger.info(`Connected to RabbitMQ at: ${AMQP_HOST}`);
      return service;
    });
};
