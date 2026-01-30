import {
  AdspId,
  adspId,
  ServiceDirectory,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { io } from 'socket.io-client';
import { Logger } from 'winston';

export async function handleRoomUpdate(
  serviceId: AdspId,
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  onUpdate: () => void
) {
  const pushServiceUrl = await directory.getServiceUrl(
    adspId`urn:ads:platform:push-service`
  );
  const streamUrl = new URL(`/${serviceId.namespace}`, pushServiceUrl);
  streamUrl.protocol = 'wss';

  const token = await tokenProvider.getAccessToken();
  const socket = io(streamUrl.href, {
    query: {
      stream: 'room-updates',
    },
    withCredentials: true,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  socket.on('connect', () => {
    logger.info('Connected for room updates...');
  });

  socket.on('configuration-service:configuration-updated', () => {
    onUpdate();
  });
}
