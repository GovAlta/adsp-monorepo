import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { AdspId } from '../utils';
import { EventServiceImpl } from './eventService';

export type { DomainEvent, DomainEventDefinition } from './event';
export type { EventService } from './eventService';

interface EventServiceOptions {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
  serviceId: AdspId;
}

export const createEventService = ({
  logger,
  directory,
  tokenProvider,
  serviceId,
}: EventServiceOptions): EventServiceImpl => {
  return new EventServiceImpl(logger, directory, tokenProvider, serviceId);
};
