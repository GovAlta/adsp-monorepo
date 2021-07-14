import type { TokenProvider } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import axios from 'axios';
import type { Logger } from 'winston';

interface LogEventJobProps {
  logger: Logger;
  valueServiceUrl: URL;
  tokenProvider: TokenProvider;
}

export const createLogEventJob = ({ logger, valueServiceUrl, tokenProvider }: LogEventJobProps) => async (
  event: DomainEvent,
  done: (err?: unknown) => void
): Promise<void> => {
  const writeUrl = new URL('v1/event-service/values/event', valueServiceUrl);
  const { timestamp, correlationId, tenantId, context, namespace, name, payload } = event;

  logger.debug(`Writing event to log (${namespace}:${name})...`, { context: 'EventLog', tenantId });

  const { namespace: vNamespace, name: vName } = context || {};
  // Skip logging of event value written events for the event log itself; otherwise it would be in a loop.
  if (
    namespace === 'value-service' &&
    name === 'value-written' &&
    vNamespace === 'event-service' &&
    vName === 'event'
  ) {
    logger.debug('Skipping logging for event log written event.');
    done();
    return;
  }

  try {
    const token = await tokenProvider.getAccessToken();
    await axios.post(
      writeUrl.href,
      {
        timestamp,
        correlationId,
        tenantId: `${tenantId}`,
        context: {
          ...(context || {}),
          namespace,
          name,
        },
        value: { payload },
        metrics: {
          [`${namespace}:${name}:count`]: 1,
          count: 1,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    logger.info(`Wrote event '${event.namespace}:${event.name}' to log.`, { context: 'EventLog', tenantId });
    done();
  } catch (err) {
    logger.debug(`Error encountered trying to log event. ${err}`, { context: 'EventLog', tenantId });
    done(err);
  }
};
