import { io } from 'socket.io-client';
import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { AdspId, adspId } from '../utils';
import { ConfigurationServiceImpl } from './configurationService';

interface StreamItem {
  tenantId: string;
  namespace: string;
  name: string;
  payload: {
    namespace: string;
    name: string;
  };
}
const LOG_CONTEXT = { context: 'handleConfigurationUpdates' };

export const handleConfigurationUpdates = async (
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  configurationService: ConfigurationServiceImpl
) => {
  const pushServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:push-service`);
  const streamUrl = new URL('', pushServiceUrl);

  const socket = io(streamUrl.href, {
    autoConnect: true,
    reconnection: true,
    query: {
      stream: 'configuration-updates',
    },
    transports: ['websocket'],
    withCredentials: true,
    auth: async (cb) => cb({ token: await tokenProvider.getAccessToken() }),
  });

  socket.on('connect', () => {
    logger.info('Connected for configuration updates...', LOG_CONTEXT);
  });

  socket.on('connect_error', async (err) => {
    logger.error(`Connect to configuration updates failed with error: ${err}`, LOG_CONTEXT);
  });

  socket.on('disconnect', async (reason) => {
    logger.debug(`Disconnected from configuration updates due to reason: ${reason}`);
  });

  const invalidateCached = (e: StreamItem) => {
    const tenantId = AdspId.parse(e.tenantId);
    const { namespace, name } = e.payload;
    logger.debug(
      `Received configuration updated stream item ${namespace}:${name} and invalidating cache of tenant ${tenantId}`,
      { ...LOG_CONTEXT, tenantId: e.tenantId }
    );

    configurationService.clearCached(tenantId, namespace, name);
  };

  socket.on('configuration-service:configuration-updated', invalidateCached);
  socket.on('configuration-service:active-revision-set', invalidateCached);
};
