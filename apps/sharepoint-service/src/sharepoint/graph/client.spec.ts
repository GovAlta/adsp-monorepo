import axios from 'axios';
import { GraphClient } from './client';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('GraphClient', () => {
  const siteId = 'contoso.sharepoint.com,5a58bb09-1fba-41c1-8125-69da264370a0,9f2ec1da-0be4-4a74-9254-973f0add78fd';
  const itemsUrl = `https://graph.example/v1.0/sites/${siteId}/lists/list-1/items`;
  const auth = { headers: { Authorization: 'Bearer token-1' } };
  const client = new GraphClient('https://graph.example/v1.0/');

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.patch.mockReset();
    axiosMock.isAxiosError.mockReset();
  });

  it('creates an item with its fields and returns the item ID', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { id: '7' } });

    expect(await client.createItem('token-1', siteId, 'list-1', { AdspItemKey: 'k1', FirstName: 'Ada' })).toBe('7');
    expect(axiosMock.post).toHaveBeenCalledWith(itemsUrl, { fields: { AdspItemKey: 'k1', FirstName: 'Ada' } }, auth);
  });

  it('finds an item by key with a filter on the key column', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { value: [{ id: '7' }] } });

    expect(await client.findItemIdByKey('token-1', siteId, 'list-1', 'AdspItemKey', 'k1')).toBe('7');
    expect(axiosMock.get).toHaveBeenCalledWith(itemsUrl, {
      ...auth,
      params: {
        $filter: "fields/AdspItemKey eq 'k1'",
        $select: 'id',
        $expand: 'fields($select=AdspItemKey)',
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
    expect(axiosMock.patch).toHaveBeenCalledWith(`${itemsUrl}/7/fields`, { FirstName: 'Grace' }, auth);
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
});
