import axios from 'axios';
import { toSharePointError } from '../errors';

// Graph site IDs are "host,siteGuid,webGuid"; keep the commas readable in the path.
const encodeSegment = (value: string) => encodeURIComponent(value).replace(/%2C/gi, ',');

export class GraphClient {
  constructor(private graphUrl: string) {}

  private itemsUrl(siteId: string, listId: string): string {
    return `${this.graphUrl.replace(/\/$/, '')}/sites/${encodeSegment(siteId)}/lists/${encodeSegment(listId)}/items`;
  }

  private headers(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async findItemIdByKey(
    token: string,
    siteId: string,
    listId: string,
    keyColumn: string,
    key: string,
  ): Promise<string | null> {
    try {
      const { data } = await axios.get<{ value: { id: string }[] }>(this.itemsUrl(siteId, listId), {
        headers: this.headers(token),
        params: {
          $filter: `fields/${keyColumn} eq '${key.replace(/'/g, "''")}'`,
          $select: 'id',
          $expand: `fields($select=${keyColumn})`,
        },
      });
      return data.value[0]?.id ?? null;
    } catch (err) {
      throw toSharePointError(err);
    }
  }

  async createItem(token: string, siteId: string, listId: string, fields: Record<string, unknown>): Promise<string> {
    try {
      const { data } = await axios.post<{ id: string }>(
        this.itemsUrl(siteId, listId),
        { fields },
        { headers: this.headers(token) },
      );
      return data.id;
    } catch (err) {
      throw toSharePointError(err);
    }
  }

  async updateItemFields(
    token: string,
    siteId: string,
    listId: string,
    itemId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    try {
      await axios.patch(`${this.itemsUrl(siteId, listId)}/${encodeSegment(itemId)}/fields`, fields, {
        headers: this.headers(token),
      });
    } catch (err) {
      throw toSharePointError(err);
    }
  }
}
