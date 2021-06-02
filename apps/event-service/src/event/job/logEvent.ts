import { Logger } from 'winston';
import { ValueServiceClient } from '@core-services/core-common';
import { DomainEvent } from '../types';

interface LogEventJobProps {
  logger: Logger;
  valueService: ValueServiceClient;
}

export const createLogEventJob = ({ logger, valueService }: LogEventJobProps) => async (
  event: DomainEvent,
  done: () => void
): Promise<void> => {
  logger.debug(`Writing event to log (event:${event.namespace}-${event.name})...`);
  const { timestamp, correlationId, context, namespace, name, payload } = event;

  await valueService.write('event', `${event.namespace}-${event.name}`, {
    timestamp,
    correlationId,
    context: {
      ...(context || {}),
      'event-namespace': namespace,
      'event-name': name,
    },
    value: payload,
  });

  logger.info(`Wrote event to log (event:${event.namespace}-${event.name}).`);

  done();
};
