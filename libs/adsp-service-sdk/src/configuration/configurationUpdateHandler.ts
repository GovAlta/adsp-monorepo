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

  let token = await tokenProvider.getAccessToken();
  const socket = io(streamUrl.href, {
    autoConnect: true,
    reconnection: false,
    query: {
      stream: 'configuration-updates',
    },
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  socket.on('connect', () => {
    logger.info('Connected for configuration updates...', LOG_CONTEXT);
  });

  socket.on('disconnect', async (reason) => {
    logger.debug(`Disconnected from configuration updates due to reason: ${reason}`);

    token = await tokenProvider.getAccessToken();
    socket.io.opts.extraHeaders = { Authorization: `Bearer ${token}` };
    socket.connect();
  });

  const invalidateCached = (e: StreamItem) => {
    const tenantId = AdspId.parse(e.tenantId);
    const serviceId = adspId`urn:ads:${e.payload.namespace}:${e.payload.name}`;
    logger.debug(
      `Received configuration updated stream item ${e.namespace}:${e.name} and invalidating cache for ${serviceId} of tenant ${tenantId}`,
      { ...LOG_CONTEXT, tenantId: e.tenantId }
    );

    configurationService.clearCached(tenantId, serviceId);
  };

  socket.on('configuration-service:configuration-updated', invalidateCached);
  socket.on('configuration-service:active-revision-set', invalidateCached);
};
