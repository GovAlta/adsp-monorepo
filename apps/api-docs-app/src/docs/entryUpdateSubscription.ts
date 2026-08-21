import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { io, Socket } from 'socket.io-client';
import { Logger } from 'winston';
import { ServiceDocs } from './serviceDocs';

interface SubscriptionProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  serviceDocs: ServiceDocs;
}

const LOG_CONTEXT = { context: 'connectEntryUpdateSubscription' };

export const connectEntryUpdateSubscription = async ({
  logger,
  directory,
  tokenProvider,
  serviceDocs,
}: SubscriptionProps): Promise<Socket> => {
  const pushServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:push-service`);
  const streamUrl = new URL('', pushServiceUrl);

  const socket = io(streamUrl.href, {
    autoConnect: true,
    reconnection: true,
    query: { stream: 'directory-entry-updates' },
    transports: ['websocket'],
    withCredentials: true,
    auth: async (cb) => cb({ token: await tokenProvider.getAccessToken() }),
  });

  socket.on('connect', () => logger.info('Connected for directory entry updates...', LOG_CONTEXT));
  socket.on('connect_error', (err) => logger.error(`Connect to directory entry updates failed with error: ${err}`, LOG_CONTEXT));
  socket.on('disconnect', (reason) => logger.debug(`Disconnected from directory entry updates due to reason: ${reason}`, LOG_CONTEXT));

  const handleEntryEvent = ({ payload }: { payload: { namespace: string } }) => {
    const { namespace } = payload;
    if (namespace) {
      logger.debug(`Received directory entry update for namespace ${namespace}, invalidating cache.`, LOG_CONTEXT);
      serviceDocs.invalidate(adspId`urn:ads:${namespace}`);
    }
  };

  socket.on('directory-service:entry-updated', handleEntryEvent);
  socket.on('directory-service:entry-deleted', handleEntryEvent);

  return socket;
};
