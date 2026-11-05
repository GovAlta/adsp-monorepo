import { ClientSecretCredential } from '@azure/identity';
import { GoAError } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { SharePointConnection } from './connections';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

const credentials = new Map<string, ClientSecretCredential>();

const credentialKey = (adspTenantId: string, destinationId: string): string => `${adspTenantId}:${destinationId}`;

export const acquireGraphToken = async (
  adspTenantId: string,
  destinationId: string,
  connection: SharePointConnection,
  logger: Logger,
): Promise<void> => {
  const key = credentialKey(adspTenantId, destinationId);
  let credential = credentials.get(key);
  if (!credential) {
    credential = new ClientSecretCredential(connection.azureTenantId, connection.clientId, connection.clientSecret);
    credentials.set(key, credential);
  }

  try {
    await credential.getToken(GRAPH_SCOPE);
  } catch (err) {
    credentials.delete(key);
    logger.error(
      `Microsoft Graph authentication failed for destination ${destinationId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    throw new GoAError('Unable to authenticate to Microsoft Graph for this connection.', { statusCode: 502 });
  }
};
