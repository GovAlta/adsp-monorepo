import { TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import type { Logger } from 'winston';
import type { DomainEvent } from '../types';

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

  logger.debug(`Writing event to log (event:${event.namespace}-${event.name})...`, { context: 'EventLog', tenantId });

  try {
    const token = await tokenProvider.getAccessToken();
    await axios.post(
      writeUrl.href,
      {
        timestamp,
        correlationId,
        tenantId,
        context: {
          ...(context || {}),
          namespace,
          name,
        },
        value: payload,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    logger.info(`Wrote event '${event.namespace}:${event.name}' to log.`, { context: 'EventLog', tenantId });
    done();
  } catch (err) {
    done(err);
  }
};
