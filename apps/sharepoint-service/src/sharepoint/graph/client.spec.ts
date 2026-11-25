import axios from 'axios';
import { GraphClient } from './client';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('GraphClient', () => {
  const siteId = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
  const itemsUrl = `https://graph.example/v1.0/sites/${siteId}/lists/list-1/items`;
  const auth = { headers: { Authorization: 'Bearer token-1' } };
  const writeAuth = { headers: { Authorization: 'Bearer token-1', Prefer: 'apiversion=2.1' } };
  const client = new GraphClient('https://graph.example/v1.0/');

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.patch.mockReset();
    axiosMock.delete.mockReset();
    axiosMock.isAxiosError.mockReset();
  });

  it('creates an item with its fields and returns the item ID', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { id: '7' } });

    expect(await client.createItem('token-1', siteId, 'list-1', { AdspItemKey: 'k1', FirstName: 'Ada' })).toBe('7');
    expect(axiosMock.post).toHaveBeenCalledWith(
      itemsUrl,
      { fields: { AdspItemKey: 'k1', FirstName: 'Ada' } },
      writeAuth,
    );
  });

  it('writes a Hyperlink value as a Url and Description object', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { id: '8' } });
    const proof = { Url: 'https://sp.example/proof.pdf', Description: 'proof.pdf' };

    await client.createItem('token-1', siteId, 'list-1', { ProofOfIdentity: proof });
    expect(axiosMock.post).toHaveBeenCalledWith(itemsUrl, { fields: { ProofOfIdentity: proof } }, writeAuth);
  });

  it('finds an item by key, asking only for its ID', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { value: [{ id: '7' }] } });

    expect(await client.findItemIdByKey('token-1', siteId, 'list-1', 'AdspItemKey', 'k1')).toBe('7');
    expect(axiosMock.get).toHaveBeenCalledWith(itemsUrl, {
      ...auth,
      params: {
        $filter: "fields/AdspItemKey eq 'k1'",
        $select: 'id',
      },
    });
  });

  it('returns null when no item has the key', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { value: [] } });

    expect(await client.findItemIdByKey('token-1', siteId, 'list-1', 'AdspItemKey', 'none')).toBeNull();
  });

  it('escapes quotes in keys', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { value: [] } });

    await client.findItemIdByKey('token-1', siteId, 'list-1', 'AdspItemKey', "O'Brien-2026");
    expect(axiosMock.get).toHaveBeenCalledWith(
      itemsUrl,
      expect.objectContaining({
        params: expect.objectContaining({ $filter: "fields/AdspItemKey eq 'O''Brien-2026'" }),
      }),
    );
  });

  it('updates the fields of an existing item', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: {} });

    await client.updateItemFields('token-1', siteId, 'list-1', '7', { FirstName: 'Grace' });
    expect(axiosMock.patch).toHaveBeenCalledWith(`${itemsUrl}/7/fields`, { FirstName: 'Grace' }, writeAuth);
  });

  it('maps a Graph error to its code', async () => {
    axiosMock.isAxiosError.mockReturnValue(true);
    axiosMock.post.mockRejectedValueOnce({
      response: { status: 403, data: { error: { code: 'accessDenied', message: 'Access denied' } } },
    });

    await expect(client.createItem('token-1', siteId, 'list-1', { AdspItemKey: 'k1' })).rejects.toMatchObject({
      errorCode: 'graph:accessDenied',
      retryable: false,
    });
  });

  describe('child rows', () => {
    const nextLink = `${itemsUrl}?$skiptoken=page-2`;

    it('finds the IDs of every row with a value in a column, following pages', async () => {
      axiosMock.get
        .mockResolvedValueOnce({ data: { value: [{ id: '1' }, { id: '2' }], '@odata.nextLink': nextLink } })
        .mockResolvedValueOnce({ data: { value: [{ id: '3' }] } });

      expect(await client.findItemIdsByField('token-1', siteId, 'list-1', 'ParentItemId', "4'2")).toEqual([
        '1',
        '2',
        '3',
      ]);
      expect(axiosMock.get).toHaveBeenNthCalledWith(1, itemsUrl, {
        ...auth,
        params: { $filter: "fields/ParentItemId eq '4''2'", $select: 'id' },
      });
      expect(axiosMock.get).toHaveBeenNthCalledWith(2, nextLink, auth);
    });

    it('refuses to follow a next page link to another host', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { value: [{ id: '1' }], '@odata.nextLink': 'https://elsewhere.example/v1.0/items?page=2' },
      });

      await expect(client.findItemIdsByField('token-1', siteId, 'list-1', 'ParentItemId', '42')).rejects.toMatchObject({
        errorCode: 'graph:invalidNextLink',
        retryable: false,
      });
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
    });

    it('deletes a row', async () => {
      axiosMock.delete.mockResolvedValueOnce({ status: 204 });

      await client.deleteItem('token-1', siteId, 'list-1', '7');
      expect(axiosMock.delete).toHaveBeenCalledWith(`${itemsUrl}/7`, auth);
    });

    it('treats a row that is already gone as deleted', async () => {
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.delete.mockRejectedValueOnce({
        response: { status: 404, data: { error: { code: 'itemNotFound', message: 'Item not found' } } },
      });

      await expect(client.deleteItem('token-1', siteId, 'list-1', '7')).resolves.toBeUndefined();
    });

    it('reports other delete failures', async () => {
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.delete.mockRejectedValueOnce({
        response: { status: 503, data: { error: { code: 'serviceNotAvailable', message: 'Busy' } } },
      });

      await expect(client.deleteItem('token-1', siteId, 'list-1', '7')).rejects.toMatchObject({
        errorCode: 'graph:serviceNotAvailable',
        retryable: true,
      });
    });
  });

  describe('lists and columns', () => {
    const siteUrl = `https://graph.example/v1.0/sites/${siteId}`;
    const writeHeaders = writeAuth;

    it('reads the column definitions of a list and works out their types, never its rows', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          value: [
            { id: 'c1', name: 'Title', displayName: 'Title', indexed: false, required: true, text: {} },
            { id: 'c2', name: 'Notes', displayName: 'Notes', indexed: false, text: { allowMultipleLines: true } },
            { id: 'c3', name: 'Amount', displayName: 'Amount', number: {} },
            { id: 'c4', name: 'Fee', displayName: 'Fee', currency: {} },
            { id: 'c5', name: 'Due', displayName: 'Due', dateTime: {} },
            { id: 'c6', name: 'Consent', displayName: 'Consent', boolean: {} },
            { id: 'c7', name: 'Methods', displayName: 'Methods', choice: { displayAs: 'checkBoxes' } },
            { id: 'c8', name: 'Status', displayName: 'Status', choice: { displayAs: 'dropDownMenu' } },
            { id: 'c9', name: 'Proof', displayName: 'Proof', hyperlinkOrPicture: { isPicture: false } },
            { id: 'c10', name: 'Owner', displayName: 'Owner', personOrGroup: {} },
            { id: 'c11', name: 'AdspItemKey', displayName: 'AdspItemKey', indexed: true, text: {} },
            { id: 'c12', name: 'Website', displayName: 'Website' },
          ],
        },
      });

      const columns = await client.getListColumns('token-1', siteId, 'list-1');

      expect(axiosMock.get).toHaveBeenCalledWith(`${siteUrl}/lists/list-1/columns`, auth);
      expect(columns.map(({ name, type }) => [name, type])).toEqual([
        ['Title', 'text'],
        ['Notes', 'multilineText'],
        ['Amount', 'number'],
        ['Fee', 'number'],
        ['Due', 'dateTime'],
        ['Consent', 'boolean'],
        ['Methods', 'multiChoice'],
        ['Status', 'choice'],
        ['Proof', 'hyperlink'],
        ['Owner', 'other'],
        ['AdspItemKey', 'text'],
        ['Website', 'unknown'],
      ]);
      expect(columns[0]).toEqual({
        id: 'c1',
        name: 'Title',
        displayName: 'Title',
        indexed: false,
        required: true,
        type: 'text',
      });
      expect(columns[10].indexed).toBe(true);
    });

    it('finds a list by its name', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { value: [{ id: 'list-9', displayName: "Bo's members" }] } });

      expect(await client.findListIdByName('token-1', siteId, "Bo's members")).toBe('list-9');
      expect(axiosMock.get).toHaveBeenCalledWith(`${siteUrl}/lists`, {
        ...auth,
        params: { $filter: "displayName eq 'Bo''s members'", $select: 'id,displayName' },
      });
    });

    it('returns null when no list has the name', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { value: [] } });

      expect(await client.findListIdByName('token-1', siteId, 'Members')).toBeNull();
    });

    it('creates a generic list and returns its ID', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { id: 'list-9' } });

      expect(await client.createList('token-1', siteId, 'Household members')).toBe('list-9');
      expect(axiosMock.post).toHaveBeenCalledWith(
        `${siteUrl}/lists`,
        { displayName: 'Household members', list: { template: 'genericList' } },
        writeHeaders,
      );
    });

    it('creates a document library and returns its ID', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { id: 'library-9' } });

      expect(await client.createList('token-1', siteId, 'Applicant documents', 'documentLibrary')).toBe('library-9');
      expect(axiosMock.post).toHaveBeenCalledWith(
        `${siteUrl}/lists`,
        { displayName: 'Applicant documents', list: { template: 'documentLibrary' } },
        writeHeaders,
      );
    });

    it.each([
      ['text', { text: {} }],
      ['multilineText', { text: { allowMultipleLines: true } }],
      ['number', { number: {} }],
      ['dateTime', { dateTime: { format: 'dateTime' } }],
      ['boolean', { boolean: {} }],
      ['multiChoice', { choice: { allowTextEntry: true, choices: ['Email', 'Phone'], displayAs: 'checkBoxes' } }],
      ['hyperlink', { hyperlinkOrPicture: { isPicture: false } }],
    ])('creates a %s column', async (type, facet) => {
      axiosMock.post.mockResolvedValueOnce({ data: { id: 'c1' } });

      await client.createColumn('token-1', siteId, 'list-1', {
        name: 'Column',
        displayName: 'Column',
        type: type as Parameters<GraphClient['createColumn']>[3]['type'],
        indexed: false,
        choices: ['Email', 'Phone'],
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        `${siteUrl}/lists/list-1/columns`,
        { name: 'Column', displayName: 'Column', indexed: false, ...facet },
        writeHeaders,
      );
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('creates a column under its name and then gives it the display name', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { id: 'c1' } });
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await client.createColumn('token-1', siteId, 'list-1', {
        name: 'ApplicantFirstName',
        displayName: 'First name',
        type: 'text',
        indexed: false,
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        `${siteUrl}/lists/list-1/columns`,
        { name: 'ApplicantFirstName', displayName: 'ApplicantFirstName', indexed: false, text: {} },
        writeHeaders,
      );
      expect(axiosMock.patch).toHaveBeenCalledWith(
        `${siteUrl}/lists/list-1/columns/c1`,
        { displayName: 'First name' },
        writeHeaders,
      );
    });

    it('updates a column', async () => {
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await client.updateColumn('token-1', siteId, 'list-1', 'c1', { indexed: true });

      expect(axiosMock.patch).toHaveBeenCalledWith(
        `${siteUrl}/lists/list-1/columns/c1`,
        { indexed: true },
        writeHeaders,
      );
    });

    it('maps a refused column change to its Graph error code', async () => {
      axiosMock.isAxiosError.mockReturnValue(true);
      axiosMock.post.mockRejectedValueOnce({
        response: { status: 403, data: { error: { code: 'accessDenied', message: 'Access denied' } } },
      });

      await expect(
        client.createColumn('token-1', siteId, 'list-1', { name: 'A', displayName: 'A', type: 'text', indexed: false }),
      ).rejects.toMatchObject({ errorCode: 'graph:accessDenied', retryable: false });
    });
  });

  describe('when Graph is briefly unavailable during setup', () => {
    const siteUrl = `https://graph.example/v1.0/sites/${siteId}`;
    const unavailable = () => ({
      response: { status: 503, headers: {}, data: { error: { code: 'serviceNotAvailable', message: 'Try later' } } },
    });
    const lostResponse = () => ({ code: 'ECONNRESET' });
    const column = { name: 'ApplicantFirstName', displayName: 'First name', type: 'text' as const, indexed: false };
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
      axiosMock.isAxiosError.mockReturnValue(true);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('reads the columns again', async () => {
      axiosMock.get.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce({ data: { value: [] } });

      expect(await settle(client.getListColumns('token-1', siteId, 'list-1'))).toEqual({ value: [] });
      expect(axiosMock.get).toHaveBeenCalledTimes(2);
    });

    it('creates a column again when SharePoint refused it', async () => {
      axiosMock.post.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce({ data: { id: 'c1' } });
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      await settle(client.createColumn('token-1', siteId, 'list-1', column));

      expect(axiosMock.post).toHaveBeenCalledTimes(2);
    });

    it('does not create a list or column again after a lost response, since it may exist', async () => {
      axiosMock.post.mockRejectedValue(lostResponse());

      const list = await settle(client.createList('token-1', siteId, 'Pets'));
      const created = await settle(client.createColumn('token-1', siteId, 'list-1', column));

      expect(list).toEqual({ error: expect.objectContaining({ errorCode: 'network' }) });
      expect(created).toEqual({ error: expect.objectContaining({ errorCode: 'network' }) });
      expect(axiosMock.post).toHaveBeenCalledTimes(2);
      expect(axiosMock.post).toHaveBeenCalledWith(`${siteUrl}/lists`, expect.anything(), writeAuth);
    });

    it('renames a new column again without creating it twice', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { id: 'c1' } });
      axiosMock.patch.mockRejectedValueOnce(unavailable()).mockResolvedValueOnce({ data: {} });

      await settle(client.createColumn('token-1', siteId, 'list-1', column));

      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      expect(axiosMock.patch).toHaveBeenCalledTimes(2);
    });
  });
});
