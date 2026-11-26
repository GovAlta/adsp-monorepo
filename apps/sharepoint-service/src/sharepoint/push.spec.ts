import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import {
  ConnectionNotFoundError,
  DestinationDisabledError,
  DestinationNotFoundError,
  DestinationNotSetUpError,
  DetailRowsFailedError,
  SharePointError,
} from './errors';
import { GraphClient, GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { MAX_DETAIL_ROWS, SharePointPusher } from './push';
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

  let graph: {
    findItemIdByKey: jest.Mock;
    createItem: jest.Mock;
    updateItemFields: jest.Mock;
    findItemIdsByField: jest.Mock;
    deleteItem: jest.Mock;
  };
  let tokens: { getToken: jest.Mock; evict: jest.Mock };
  let pusher: SharePointPusher;

  beforeEach(() => {
    graph = {
      findItemIdByKey: jest.fn().mockResolvedValue(null),
      createItem: jest.fn().mockResolvedValue('item-new'),
      updateItemFields: jest.fn().mockResolvedValue(undefined),
      findItemIdsByField: jest.fn().mockResolvedValue([]),
      deleteItem: jest.fn().mockResolvedValue(undefined),
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

  it('clears the link on the existing row when a file is removed', async () => {
    graph.findItemIdByKey.mockResolvedValueOnce('item-7');
    const withProof: SharePointConfiguration = {
      ...configuration,
      destinations: {
        'hr-proof': {
          ...intake,
          id: 'hr-proof',
          fieldMappings: [{ source: 'proof', target: 'Proof', columnType: 'hyperlink' }],
        },
      },
    };

    await pusher.push(tenantId, withProof, 'hr-proof', { applicationNumber: 'A-1', proof: '' });

    expect(graph.updateItemFields).toHaveBeenCalledWith('token-1', siteId, 'list-1', 'item-7', {
      Proof: null,
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
    const error = await pusher.push(tenantId, configuration, 'missing', {}).catch((err) => err);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(DestinationNotFoundError);
  });

  it('throws not found when the connection is missing', async () => {
    const error = await pusher
      .push(tenantId, { ...configuration, connections: {} }, 'hr-intake', { applicationNumber: 'A-1' })
      .catch((err) => err);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(ConnectionNotFoundError);
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

  describe('retries', () => {
    const unavailable = () => new SharePointError('graph:serviceNotAvailable', true, undefined, 503);
    const throttled = () => new SharePointError('graph:TooManyRequests', true, undefined, 429);
    const network = () => new SharePointError('network', true);
    const keyed = { applicationNumber: 'A-1', amount: 1 };

    const settle = async <T>(promise: Promise<T>) => {
      const settled = promise.then(
        (value) => ({ value }),
        (error) => ({ error }),
      );
      await jest.runAllTimersAsync();
      return settled;
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('repeats a row write that gets 503 and returns the result', async () => {
      graph.findItemIdByKey.mockRejectedValueOnce(unavailable());

      const result = await settle(pusher.push(tenantId, configuration, 'hr-intake', keyed));

      expect(result).toEqual({ value: { itemId: 'item-new', outcome: 'created' } });
      expect(graph.findItemIdByKey).toHaveBeenCalledTimes(2);
      expect(graph.createItem).toHaveBeenCalledTimes(1);
    });

    it('stops within the retry budget and reports a retryable failure when SharePoint keeps failing', async () => {
      graph.findItemIdByKey.mockRejectedValue(unavailable());

      const result = await settle(pusher.push(tenantId, configuration, 'hr-intake', keyed));

      expect(result).toEqual({
        error: expect.objectContaining({ errorCode: 'graph:serviceNotAvailable', retryable: true }),
      });
      expect(graph.findItemIdByKey).toHaveBeenCalledTimes(4);
      expect(graph.createItem).not.toHaveBeenCalled();
    });

    it('updates the row instead of adding a second one when a create may have succeeded', async () => {
      graph.findItemIdByKey.mockResolvedValueOnce(null).mockResolvedValueOnce('item-9');
      graph.createItem.mockRejectedValueOnce(network());

      const result = await settle(pusher.push(tenantId, configuration, 'hr-intake', keyed));

      expect(result).toEqual({ value: { itemId: 'item-9', outcome: 'updated' } });
      expect(graph.createItem).toHaveBeenCalledTimes(1);
      expect(graph.updateItemFields).toHaveBeenCalledWith('token-1', siteId, 'list-1', 'item-9', {
        Amount: 1,
        AdspItemKey: 'A-1',
      });
    });

    it('repeats a create without a row identity when SharePoint refused it', async () => {
      graph.createItem.mockRejectedValueOnce(throttled());

      const result = await settle(pusher.push(tenantId, configuration, 'hr-log', { amount: 1 }));

      expect(result).toEqual({ value: { itemId: 'item-new', outcome: 'created' } });
      expect(graph.createItem).toHaveBeenCalledTimes(2);
    });

    it('does not repeat a create without a row identity after a lost response', async () => {
      graph.createItem.mockRejectedValueOnce(network());

      const result = await settle(pusher.push(tenantId, configuration, 'hr-log', { amount: 1 }));

      expect(result).toEqual({ error: expect.objectContaining({ errorCode: 'network', retryable: true }) });
      expect(graph.createItem).toHaveBeenCalledTimes(1);
    });

    it('does not repeat a write that SharePoint rejected', async () => {
      graph.createItem.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'Amount', 400));

      const result = await settle(pusher.push(tenantId, configuration, 'hr-log', { amount: 1 }));

      expect(result).toEqual({ error: expect.objectContaining({ errorCode: 'graph:invalidRequest' }) });
      expect(graph.createItem).toHaveBeenCalledTimes(1);
    });

    it('retries a test the same way as a push', async () => {
      graph.findItemIdByKey.mockRejectedValueOnce(unavailable());

      const result = await settle(pusher.test(tenantId, configuration, 'hr-off', { applicationNumber: 'T-1' }));

      expect(result).toEqual({ value: { itemId: 'item-new', outcome: 'created' } });
      expect(graph.findItemIdByKey).toHaveBeenCalledTimes(2);
    });
  });

  it('sets the folder link column to the link it is given', async () => {
    const withFolder = {
      ...configuration,
      destinations: { 'hr-intake': { ...intake, folderLinkField: 'FilesFolder' } },
    };
    const folderLink = { Url: 'https://sp.example/Shared%20Documents/A-1', Description: 'A-1' };

    await pusher.push(tenantId, withFolder, 'hr-intake', { applicationNumber: 'A-1', amount: 1 }, { folderLink });

    expect(graph.createItem).toHaveBeenCalledWith('token-1', siteId, 'list-1', {
      Amount: 1,
      FilesFolder: folderLink,
      AdspItemKey: 'A-1',
    });
  });

  it('ignores a folder link when the destination has no folder link column', async () => {
    await pusher.push(
      tenantId,
      configuration,
      'hr-intake',
      { applicationNumber: 'A-1', amount: 1 },
      {
        folderLink: { Url: 'https://sp.example/folder', Description: 'A-1' },
      },
    );

    expect(graph.createItem).toHaveBeenCalledWith('token-1', siteId, 'list-1', { Amount: 1, AdspItemKey: 'A-1' });
  });

  describe('detail lists', () => {
    const members = {
      listId: 'members',
      dataPath: 'householdMembers',
      parentRefField: 'ParentItemId',
      fieldMappings: [
        { source: 'name', target: 'MemberName' },
        { source: 'languages', target: 'Languages' },
      ],
    };
    const household: SharePointDestination = { ...intake, id: 'household', detailLists: [members] };
    const withDestination = (destination: SharePointDestination) => ({
      ...configuration,
      destinations: { [destination.id]: destination },
    });
    const config = withDestination(household);
    const data = (count: number) => ({
      applicationNumber: 'A-1',
      applicant: { firstName: 'Ada' },
      householdMembers: Array.from({ length: count }, (_, i) => ({ name: `Member ${i + 1}` })),
    });
    const createdIn = (listId: string) => graph.createItem.mock.calls.filter(([, , list]) => list === listId);

    beforeEach(() => {
      let next = 0;
      graph.createItem.mockImplementation(async (_t, _s, listId) => (listId === 'list-1' ? 'item-new' : `m-${++next}`));
    });

    describe('retries', () => {
      const unavailable = () => new SharePointError('graph:serviceNotAvailable', true, undefined, 503);
      const settle = async <T>(promise: Promise<T>) => {
        const settled = promise.then(
          (value) => ({ value }),
          (error) => ({ error }),
        );
        await jest.runAllTimersAsync();
        return settled;
      };
      const failOnceIn = (listId: string, error: SharePointError) => {
        let failed = false;
        let next = 0;
        graph.createItem.mockImplementation(async (_t, _s, list) => {
          if (list === 'list-1') {
            return 'item-new';
          }
          if (list === listId && !failed) {
            failed = true;
            throw error;
          }
          return `m-${++next}`;
        });
      };

      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('repeats a detail row create that SharePoint refused', async () => {
        failOnceIn('members', unavailable());

        const result = await settle(pusher.push(tenantId, config, 'household', data(2)));

        expect(result).toEqual({
          value: expect.objectContaining({
            detailRows: [{ listId: 'members', rowIds: expect.arrayContaining(['m-1', 'm-2']) }],
          }),
        });
        expect(createdIn('members')).toHaveLength(3);
      });

      it('does not repeat a detail row create after a lost response, since the row may exist', async () => {
        failOnceIn('members', new SharePointError('network', true));

        const result = await settle(pusher.push(tenantId, config, 'household', data(2)));

        expect(result).toEqual({
          error: expect.objectContaining({
            errorCode: 'network',
            detailFailures: [expect.objectContaining({ indexes: [0] })],
          }),
        });
        expect(createdIn('members')).toHaveLength(2);
      });

      it('repeats the lookup of old rows and their deletion after a brief outage', async () => {
        graph.findItemIdByKey.mockResolvedValueOnce('item-7');
        graph.findItemIdsByField.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(['old-1']);
        graph.deleteItem.mockRejectedValueOnce(unavailable());

        const result = await settle(pusher.push(tenantId, config, 'household', data(1)));

        expect(result).toEqual({ value: expect.objectContaining({ outcome: 'updated' }) });
        expect(graph.findItemIdsByField).toHaveBeenCalledTimes(2);
        expect(graph.deleteItem).toHaveBeenCalledTimes(2);
      });
    });

    it('writes the main row, then one detail row per item that refers to it', async () => {
      const result = await pusher.push(tenantId, config, 'household', data(3));

      expect(result).toEqual({
        itemId: 'item-new',
        outcome: 'created',
        detailRows: [{ listId: 'members', rowIds: ['m-1', 'm-2', 'm-3'] }],
      });
      expect(graph.createItem.mock.calls[0][2]).toBe('list-1');
      expect(createdIn('members').map(([, , , fields]) => fields)).toEqual([
        { MemberName: 'Member 1', ParentItemId: 'item-new' },
        { MemberName: 'Member 2', ParentItemId: 'item-new' },
        { MemberName: 'Member 3', ParentItemId: 'item-new' },
      ]);
    });

    it('does not look for old detail rows when the main row is new', async () => {
      await pusher.push(tenantId, config, 'household', data(1));

      expect(graph.findItemIdsByField).not.toHaveBeenCalled();
      expect(graph.deleteItem).not.toHaveBeenCalled();
    });

    it.each([
      ['empty', []],
      ['missing', undefined],
      ['null', null],
    ])('writes no detail rows for an %s array', async (_case, householdMembers) => {
      const result = await pusher.push(tenantId, config, 'household', { ...data(0), householdMembers });

      expect(result.detailRows).toEqual([{ listId: 'members', rowIds: [] }]);
      expect(createdIn('members')).toHaveLength(0);
    });

    it('maps multi-select answers and values nested in each item', async () => {
      const nested = {
        ...members,
        fieldMappings: [{ source: 'contact.email', target: 'Email' }, members.fieldMappings[1]],
      };
      const item = { contact: { email: 'a@example.com' }, languages: ['English', 'Cree'] };

      await pusher.push(tenantId, withDestination({ ...household, detailLists: [nested] }), 'household', {
        ...data(0),
        householdMembers: [item],
      });

      expect(createdIn('members')[0][3]).toEqual({
        Email: 'a@example.com',
        'Languages@odata.type': 'Collection(Edm.String)',
        Languages: ['English', 'Cree'],
        ParentItemId: 'item-new',
      });
    });

    it('does not let a mapping change the parent reference column', async () => {
      const spoof = { ...members, fieldMappings: [{ source: 'name', target: 'ParentItemId' }] };

      await pusher.push(tenantId, withDestination({ ...household, detailLists: [spoof] }), 'household', data(1));

      expect(createdIn('members')[0][3]).toEqual({ ParentItemId: 'item-new' });
    });

    it('replaces the detail rows of an existing main row, writing the new rows before deleting the old ones', async () => {
      graph.findItemIdByKey.mockResolvedValueOnce('item-7');
      graph.findItemIdsByField.mockResolvedValueOnce(['old-1', 'old-2', 'old-3']);

      const result = await pusher.push(tenantId, config, 'household', data(2));

      expect(graph.findItemIdsByField).toHaveBeenCalledWith('token-1', siteId, 'members', 'ParentItemId', 'item-7');
      expect(createdIn('members').map(([, , , fields]) => fields.ParentItemId)).toEqual(['item-7', 'item-7']);
      expect(graph.deleteItem.mock.calls.map(([, , list, id]) => [list, id])).toEqual([
        ['members', 'old-1'],
        ['members', 'old-2'],
        ['members', 'old-3'],
      ]);
      const lastCreate = Math.max(...graph.createItem.mock.invocationCallOrder);
      expect(Math.min(...graph.deleteItem.mock.invocationCallOrder)).toBeGreaterThan(lastCreate);
      expect(result).toEqual({
        itemId: 'item-7',
        outcome: 'updated',
        detailRows: [{ listId: 'members', rowIds: ['m-1', 'm-2'] }],
      });
    });

    it('removes this attempt’s new rows and keeps the old rows when a detail row fails', async () => {
      graph.findItemIdByKey.mockResolvedValueOnce('item-7');
      graph.findItemIdsByField.mockResolvedValueOnce(['old-1']);
      graph.createItem.mockImplementation(async (_t, _s, listId, fields) => {
        if (fields.MemberName === 'Member 2') {
          throw new SharePointError('graph:serviceNotAvailable', true);
        }
        return listId === 'list-1' ? 'item-7' : `row-${fields.MemberName}`;
      });

      const error = await pusher.push(tenantId, config, 'household', data(3)).catch((err) => err);

      expect(error).toBeInstanceOf(DetailRowsFailedError);
      expect(error).toMatchObject({
        errorCode: 'graph:serviceNotAvailable',
        retryable: true,
        dataId: 'item-7',
        outcome: 'updated',
        detailFailures: [{ listId: 'members', indexes: [1] }],
      });
      expect(createdIn('members')).toHaveLength(3);
      expect(graph.deleteItem.mock.calls.map(([, , list, id]) => [list, id]).sort()).toEqual([
        ['members', 'row-Member 1'],
        ['members', 'row-Member 3'],
      ]);
    });

    it('reports new rows it could not remove after a detail row failed', async () => {
      graph.createItem.mockImplementation(async (_t, _s, listId, fields) => {
        if (fields.MemberName === 'Member 2') {
          throw new SharePointError('graph:invalidRequest', false, 'Age');
        }
        return listId === 'list-1' ? 'item-new' : `row-${fields.MemberName}`;
      });
      graph.deleteItem.mockRejectedValueOnce(new SharePointError('graph:serviceNotAvailable', true));

      await expect(pusher.push(tenantId, config, 'household', data(3))).rejects.toMatchObject({
        retryable: false,
        detailFailures: [{ listId: 'members', indexes: [1], newRowsLeft: 1, column: 'Age' }],
      });
    });

    it('is retryable only when every failure is', async () => {
      graph.createItem.mockImplementation(async (_t, _s, listId, fields) => {
        if (fields.MemberName === 'Member 1') {
          throw new SharePointError('graph:serviceNotAvailable', true);
        }
        if (fields.MemberName === 'Member 2') {
          throw new SharePointError('graph:invalidRequest', false, 'MemberName');
        }
        return listId === 'list-1' ? 'item-new' : 'row';
      });

      await expect(pusher.push(tenantId, config, 'household', data(2))).rejects.toMatchObject({
        retryable: false,
        detailFailures: [{ listId: 'members', indexes: [0, 1] }],
      });
    });

    it('reports old rows it could not delete', async () => {
      graph.findItemIdByKey.mockResolvedValueOnce('item-7');
      graph.findItemIdsByField.mockResolvedValueOnce(['old-1', 'old-2']);
      graph.deleteItem.mockImplementation(async (_t, _s, _l, id) => {
        if (id === 'old-2') {
          throw new SharePointError('graph:serviceNotAvailable', true);
        }
      });

      await expect(pusher.push(tenantId, config, 'household', data(1))).rejects.toMatchObject({
        dataId: 'item-7',
        outcome: 'updated',
        retryable: true,
        detailFailures: [{ listId: 'members', indexes: [], oldRowsLeft: 1 }],
      });
    });

    it('writes no detail rows to a list whose old rows cannot be looked up, and names the column', async () => {
      graph.findItemIdByKey.mockResolvedValueOnce('item-7');
      graph.findItemIdsByField.mockRejectedValueOnce(
        new SharePointError('graph:invalidRequest', false, 'ParentItemId'),
      );

      await expect(pusher.push(tenantId, config, 'household', data(2))).rejects.toMatchObject({
        errorCode: 'graph:invalidRequest',
        detailFailures: [{ listId: 'members', indexes: [0, 1], column: 'ParentItemId' }],
      });
      expect(createdIn('members')).toHaveLength(0);
    });

    it('carries on with the other detail lists when one fails', async () => {
      const second = {
        ...members,
        listId: 'pets',
        dataPath: 'pets',
        fieldMappings: [{ source: 'name', target: 'PetName' }],
      };
      graph.createItem.mockImplementation(async (_t, _s, listId) => {
        if (listId === 'members') {
          throw new SharePointError('graph:serviceNotAvailable', true);
        }
        return listId === 'list-1' ? 'item-new' : 'pet-1';
      });

      await expect(
        pusher.push(tenantId, withDestination({ ...household, detailLists: [members, second] }), 'household', {
          ...data(1),
          pets: [{ name: 'Rex' }],
        }),
      ).rejects.toMatchObject({ detailFailures: [{ listId: 'members', indexes: [0] }] });
      expect(createdIn('pets')).toHaveLength(1);
    });

    it('writes at most 3 detail rows at a time', async () => {
      let active = 0;
      let peak = 0;
      graph.createItem.mockImplementation(async (_t, _s, listId) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active--;
        return listId === 'list-1' ? 'item-new' : 'row';
      });

      await pusher.push(tenantId, config, 'household', data(10));

      expect(peak).toBe(3);
    });

    it(`rejects an array with more than ${MAX_DETAIL_ROWS} items before writing anything`, async () => {
      await expect(pusher.push(tenantId, config, 'household', data(MAX_DETAIL_ROWS + 1))).rejects.toBeInstanceOf(
        InvalidOperationError,
      );
      expect(tokens.getToken).not.toHaveBeenCalled();
    });

    it(`accepts an array with exactly ${MAX_DETAIL_ROWS} items`, async () => {
      await pusher.push(tenantId, config, 'household', data(MAX_DETAIL_ROWS));

      expect(createdIn('members')).toHaveLength(MAX_DETAIL_ROWS);
    });

    it('rejects data where the detail list path is not an array, before writing anything', async () => {
      await expect(
        pusher.push(tenantId, config, 'household', { ...data(0), householdMembers: { name: 'Ada' } }),
      ).rejects.toThrow("Data at 'householdMembers' must be a list.");
      expect(tokens.getToken).not.toHaveBeenCalled();
    });

    it('refuses to push while a detail list is not set up yet', async () => {
      const { listId: _listId, ...unset } = members;
      const notSetUp = withDestination({ ...household, detailLists: [{ ...unset, listName: 'Household members' }] });

      await expect(pusher.push(tenantId, notSetUp, 'household', data(1))).rejects.toBeInstanceOf(
        DestinationNotSetUpError,
      );
      expect(tokens.getToken).not.toHaveBeenCalled();
    });

    it('refuses a destination with detail lists but no row identity', async () => {
      const noIdentity = withDestination({ ...household, idempotencyFields: [] });

      await expect(pusher.push(tenantId, noIdentity, 'household', data(1))).rejects.toThrow('needs row identity');
      expect(tokens.getToken).not.toHaveBeenCalled();
    });

    it('writes the detail rows when testing a destination', async () => {
      const result = await pusher.test(tenantId, config, 'household', data(2));

      expect(result.detailRows).toEqual([{ listId: 'members', rowIds: ['m-1', 'm-2'] }]);
    });
  });

  describe('updating the row only', () => {
    const household: SharePointDestination = {
      ...intake,
      id: 'household',
      detailLists: [
        {
          listId: 'members',
          dataPath: 'householdMembers',
          parentRefField: 'ParentItemId',
          fieldMappings: [{ source: 'name', target: 'MemberName' }],
        },
      ],
    };
    const config = { ...configuration, destinations: { ...configuration.destinations, household } };

    it('updates only the columns in the data and leaves the detail rows alone', async () => {
      graph.findItemIdByKey.mockResolvedValueOnce('item-7');

      const result = await pusher.push(
        tenantId,
        config,
        'household',
        { applicationNumber: 'A-1', amount: 6 },
        {
          updateRowOnly: true,
        },
      );

      expect(result).toEqual({ itemId: 'item-7', outcome: 'updated' });
      expect(graph.updateItemFields).toHaveBeenCalledWith('token-1', siteId, 'list-1', 'item-7', {
        Amount: 6,
        AdspItemKey: 'A-1',
      });
      expect(graph.findItemIdsByField).not.toHaveBeenCalled();
      expect(graph.createItem).not.toHaveBeenCalled();
      expect(graph.deleteItem).not.toHaveBeenCalled();
    });

    it('fails, so it can be retried, when no row has the key yet', async () => {
      await expect(
        pusher.push(tenantId, config, 'household', { applicationNumber: 'A-1' }, { updateRowOnly: true }),
      ).rejects.toMatchObject({ errorCode: 'row-not-found', retryable: true });
      expect(graph.createItem).not.toHaveBeenCalled();
    });

    it('fails without retry when the destination has no row identity to find the row by', async () => {
      await expect(
        pusher.push(tenantId, configuration, 'hr-log', { amount: 1 }, { updateRowOnly: true }),
      ).rejects.toMatchObject({ errorCode: 'row-identity-missing', retryable: false });
      expect(tokens.getToken).not.toHaveBeenCalled();
    });
  });
});
