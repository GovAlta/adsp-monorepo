import { AdspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { DestinationDisabledError, SharePointError } from './errors';
import { GraphClient, GraphTokenProvider } from './graph';
import { ITEM_KEY_COLUMN, itemKeyFor, mapFields } from './mapper';
import { PushResult, SharePointConfiguration, SharePointConnection, SharePointDestination } from './types';

const REJECTED_TOKEN_CODE = 'graph:InvalidAuthenticationToken';

export class SharePointPusher {
  constructor(
    private tokens: GraphTokenProvider,
    private graph: GraphClient,
  ) {}

  private resolve(
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
  ): { destination: SharePointDestination; connection: SharePointConnection } {
    const destination = configuration?.destinations?.[destinationId];
    if (!destination) {
      throw new NotFoundError('SharePoint destination', destinationId);
    }
    const connection = configuration?.connections?.[destination.connectionId];
    if (!connection) {
      throw new NotFoundError('SharePoint connection', destination.connectionId);
    }
    return { destination, connection };
  }

  async push(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
    data: Record<string, unknown>,
  ): Promise<PushResult> {
    const { destination, connection } = this.resolve(configuration, destinationId);
    if (destination.enabled === false) {
      throw new DestinationDisabledError(destinationId);
    }
    const key = itemKeyFor(destination.idempotencyFields, data);
    return this.writeWithRetry(tenantId, connection, destination, key, data);
  }

  async test(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
    data: Record<string, unknown>,
  ): Promise<PushResult> {
    const { destination, connection } = this.resolve(configuration, destinationId);
    const key = itemKeyFor(destination.idempotencyFields, data);
    return this.writeWithRetry(tenantId, connection, destination, key, data);
  }

  private async writeWithRetry(
    tenantId: AdspId,
    connection: SharePointConnection,
    destination: SharePointDestination,
    key: string | null,
    data: Record<string, unknown>,
  ): Promise<PushResult> {
    const fields = mapFields(destination.fieldMappings, data, key);
    try {
      return await this.write(tenantId, connection, destination, key, fields);
    } catch (err) {
      if (!(err instanceof SharePointError) || err.errorCode !== REJECTED_TOKEN_CODE) {
        throw err;
      }
      this.tokens.evict(tenantId, connection.id);
      return this.write(tenantId, connection, destination, key, fields);
    }
  }

  private async write(
    tenantId: AdspId,
    connection: SharePointConnection,
    destination: SharePointDestination,
    key: string | null,
    fields: Record<string, unknown>,
  ): Promise<PushResult> {
    const token = await this.tokens.getToken(tenantId, connection);
    const existingId =
      key === null
        ? null
        : await this.graph.findItemIdByKey(token, connection.siteId, destination.listId, ITEM_KEY_COLUMN, key);
    if (existingId) {
      await this.graph.updateItemFields(token, connection.siteId, destination.listId, existingId, fields);
      return { itemId: existingId, outcome: 'updated' };
    }
    const itemId = await this.graph.createItem(token, connection.siteId, destination.listId, fields);
    return { itemId, outcome: 'created' };
  }
}
