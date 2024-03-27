import { AmqpWorkQueueService, WorkQueueService } from '@core-services/core-common';
import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { FeedbackWorkItem } from './feedback';

interface FeedbackQueueServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export const createFeedbackQueueService = async ({
  logger,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
}: FeedbackQueueServiceProps): Promise<WorkQueueService<FeedbackWorkItem>> => {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpWorkQueueService<FeedbackWorkItem>('feedback-service-work', logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as feedback work queue service at: ${AMQP_HOST}`);
  return service;
};
