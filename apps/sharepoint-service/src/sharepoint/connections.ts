export interface SharePointConnection {
  azureTenantId: string;
  clientId: string;
  clientSecret: string;
}

const connections = new Map<string, SharePointConnection>();

const connectionKey = (adspTenantId: string, destinationId: string): string => `${adspTenantId}:${destinationId}`;

export const registerConnection = (
  adspTenantId: string,
  destinationId: string,
  connection: SharePointConnection,
): void => {
  connections.set(connectionKey(adspTenantId, destinationId), connection);
};

export const getConnection = (adspTenantId: string, destinationId: string): SharePointConnection | undefined =>
  connections.get(connectionKey(adspTenantId, destinationId));
