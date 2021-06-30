import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import { DomainEventDefinition } from './event';
import { EventServiceImpl } from './eventService';

export type { DomainEvent, DomainEventDefinition } from './event';
export type { EventService } from './eventService';

interface EventServiceOptions {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
  serviceId: AdspId;
  events: DomainEventDefinition[];
}

export const createEventService = ({
  logger,
  directory,
  tokenProvider,
  serviceId,
  events,
}: EventServiceOptions): EventServiceImpl => {
  return new EventServiceImpl(logger, directory, tokenProvider, serviceId, events);
};
