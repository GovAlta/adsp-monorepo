import { ConnectionNotFoundError, DestinationNotFoundError } from './errors';
import { SharePointConfiguration, SharePointConnection, SharePointDestination } from './types';

export interface ResolvedDestination {
  destination: SharePointDestination;
  connection: SharePointConnection;
}

export function resolveDestination(
  configuration: SharePointConfiguration | undefined,
  destinationId: string,
): ResolvedDestination {
  const destination = configuration?.destinations?.[destinationId];
  if (!destination) {
    throw new DestinationNotFoundError(destinationId);
  }
  const connection = configuration?.connections?.[destination.connectionId];
  if (!connection) {
    throw new ConnectionNotFoundError(destination.connectionId);
  }
  return { destination, connection };
}
