import { Logger } from 'winston';
import { DomainEvent, ValueServiceClient } from '@core-services/core-common';

interface LogEventJobProps {
  logger: Logger;
  valueService: ValueServiceClient;
}

export const createLogEventJob = ({ logger, valueService }: LogEventJobProps) => (
  event: DomainEvent,
  done: () => void
) => {
  logger.debug(`Writing event to log (event:${event.namespace}-${event.name})...`);
  const { timestamp, correlationId, context, namespace, name, ...payload } = event;

  valueService
    .write('event', `${event.namespace}-${event.name}`, {
      timestamp,
      correlationId,
      context: {
        ...(context || {}),
        'event-namespace': namespace,
        'event-name': name,
      },
      value: payload,
    })
    .then(() => {
      logger.info(`Wrote event to log (event:${event.namespace}-${event.name}).`);
      done();
    });
};
