import { AmqpWorkQueueService, WorkQueueService } from '@core-services/core-common';
import { connect } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { PdfServiceWorkItem } from './pdf';

interface PdfQueueServiceProps {
  AMQP_HOST: string;
  AMQP_USER: string;
  AMQP_PASSWORD: string;
  logger: Logger;
}

export const createPdfQueueService = async ({
  logger,
  AMQP_HOST,
  AMQP_USER,
  AMQP_PASSWORD,
}: PdfQueueServiceProps): Promise<WorkQueueService<PdfServiceWorkItem>> => {
  const connection = connect({
    heartbeat: 160,
    hostname: AMQP_HOST,
    username: AMQP_USER,
    password: AMQP_PASSWORD,
  });

  const service = new AmqpWorkQueueService<PdfServiceWorkItem>('pdf-service-work', logger, connection);
  await service.connect();

  logger.info(`Connected to RabbitMQ as pdf work queue service at: ${AMQP_HOST}`);
  return service;
};
