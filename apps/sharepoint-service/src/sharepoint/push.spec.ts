import { adspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { DestinationDisabledError, SharePointError } from './errors';
import { GraphClient, GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { SharePointPusher } from './push';
import { SharePointConfiguration, SharePointDestination } from './types';

describe('SharePointPusher', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const siteId = 'contoso.sharepoint.com,site,web';
  const intake: SharePointDestination = {
    id: 'hr-intake',
    name: 'Intake',
    connectionId: 'hr-site',
    listId: 'list-1',
    fieldMappings: [
      { source: 'applicant.firstName', target: 'FirstName' },
      { source: 'amount', target: 'Amount' },
    ],
    idempotencyFields: ['applicationNumber'],
  };
  const configuration: SharePointConfiguration = {
    connections: {
      'hr-site': { id: 'hr-site', name: 'HR', entraTenantId: 'entra-tenant', clientId: 'client-1', siteId },
    },
    destinations: {
      'hr-intake': intake,
      'hr-log': { ...intake, id: 'hr-log', idempotencyFields: [] },
      'hr-off': { ...intake, id: 'hr-off', enabled: false },
    },
  };

  let graph: { findItemIdByKey: jest.Mock; createItem: jest.Mock; updateItemFields: jest.Mock };
  let tokens: { getToken: jest.Mock; evict: jest.Mock };
  let pusher: SharePointPusher;

  beforeEach(() => {
    graph = {
      findItemIdByKey: jest.fn().mockResolvedValue(null),
      createItem: jest.fn().mockResolvedValue('item-new'),
      updateItemFields: jest.fn().mockResolvedValue(undefined),
    };
    tokens = { getToken: jest.fn().mockResolvedValue('token-1'), evict: jest.fn() };
    pusher = new SharePointPusher(tokens as unknown as GraphTokenProvider, graph as unknown as GraphClient);
  });

  it('creates the row when no row has the key, writing the key to AdspItemKey', async () => {
    const result = await pusher.push(tenantId, configuration, 'hr-intake', {
      applicationNumber: 'A-1',
      applicant: { firstName: 'Ada' },
      amount: 5,
    });

    expect(result).toEqual({ itemId: 'item-new', outcome: 'created' });
    expect(graph.findItemIdByKey).toHaveBeenCalledWith('token-1', siteId, 'list-1', 'AdspItemKey', 'A-1');
    expect(graph.createItem).toHaveBeenCalledWith('token-1', siteId, 'list-1', {
      FirstName: 'Ada',
      Amount: 5,
      AdspItemKey: 'A-1',
    });
  });

  it('overwrites the row that already has the key', async () => {
    graph.findItemIdByKey.mockResolvedValueOnce('item-7');

    const result = await pusher.push(tenantId, configuration, 'hr-intake', { applicationNumber: 'A-1', amount: 6 });

    expect(result).toEqual({ itemId: 'item-7', outcome: 'updated' });
    expect(graph.updateItemFields).toHaveBeenCalledWith('token-1', siteId, 'list-1', 'item-7', {
      Amount: 6,
      AdspItemKey: 'A-1',
    });
    expect(graph.createItem).not.toHaveBeenCalled();
  });

  it('adds a new row without a lookup when the destination has no row identity', async () => {
    await pusher.push(tenantId, configuration, 'hr-log', { amount: 1 });

    expect(graph.findItemIdByKey).not.toHaveBeenCalled();
    expect(graph.createItem).toHaveBeenCalledWith('token-1', siteId, 'list-1', { Amount: 1 });
  });

  it('refuses to push to a disabled destination', async () => {
    await expect(pusher.push(tenantId, configuration, 'hr-off', { applicationNumber: 'A-1' })).rejects.toBeInstanceOf(
      DestinationDisabledError,
    );
    expect(tokens.getToken).not.toHaveBeenCalled();
  });

  it('tests a destination with the normal push logic, even when disabled', async () => {
    const result = await pusher.test(tenantId, configuration, 'hr-off', { applicationNumber: 'T-1', amount: 1 });

    expect(result).toEqual({ itemId: 'item-new', outcome: 'created' });
    expect(graph.findItemIdByKey).toHaveBeenCalledWith('token-1', siteId, 'list-1', 'AdspItemKey', 'T-1');
    expect(graph.createItem).toHaveBeenCalledWith('token-1', siteId, 'list-1', { Amount: 1, AdspItemKey: 'T-1' });
  });

  it('rejects data with no value for a row identity field before calling SharePoint', async () => {
    await expect(pusher.test(tenantId, configuration, 'hr-intake', { amount: 1 })).rejects.toBeInstanceOf(
      RowIdentityMissingError,
    );
    expect(tokens.getToken).not.toHaveBeenCalled();
  });

  it('fails before writing when the key lookup is rejected, for example a missing key column', async () => {
    graph.findItemIdByKey.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'AdspItemKey'));

    await expect(
      pusher.push(tenantId, configuration, 'hr-intake', { applicationNumber: 'A-1', amount: 1 }),
    ).rejects.toMatchObject({ errorCode: 'graph:invalidRequest', column: 'AdspItemKey' });
    expect(graph.createItem).not.toHaveBeenCalled();
  });

  it('throws not found for an unknown destination', async () => {
    await expect(pusher.push(tenantId, configuration, 'missing', {})).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws not found when the connection is missing', async () => {
    await expect(
      pusher.push(tenantId, { ...configuration, connections: {} }, 'hr-intake', { applicationNumber: 'A-1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('retries once with a new token when Graph rejects the cached token', async () => {
    graph.findItemIdByKey
      .mockRejectedValueOnce(new SharePointError('graph:InvalidAuthenticationToken', false))
      .mockResolvedValueOnce(null);

    await pusher.push(tenantId, configuration, 'hr-intake', { applicationNumber: 'A-1', amount: 1 });

    expect(tokens.evict).toHaveBeenCalledWith(tenantId, 'hr-site');
    expect(tokens.getToken).toHaveBeenCalledTimes(2);
    expect(graph.createItem).toHaveBeenCalledTimes(1);
  });

  it('does not retry other SharePoint errors', async () => {
    graph.createItem.mockRejectedValueOnce(new SharePointError('graph:TooManyRequests', true));

    await expect(pusher.push(tenantId, configuration, 'hr-log', { amount: 1 })).rejects.toMatchObject({
      errorCode: 'graph:TooManyRequests',
    });
    expect(graph.createItem).toHaveBeenCalledTimes(1);
    expect(tokens.evict).not.toHaveBeenCalled();
  });
});
