import axios from 'axios';
import { SharePointError, toSharePointError } from '../errors';
import { isRefused, requestWithRetry } from '../retry';
import { ColumnType } from '../types';

// Graph site IDs are "host,siteGuid,webGuid"; keep the commas readable in the path.
const encodeSegment = (value: string) => encodeURIComponent(value).replace(/%2C/gi, ',');
const filterEquals = (column: string, value: string) => `fields/${column} eq '${value.replace(/'/g, "''")}'`;

interface ItemIdPage {
  value: { id: string }[];
  '@odata.nextLink'?: string;
}

export type ColumnKind = ColumnType | 'choice' | 'other' | 'unknown';

export interface ListColumn {
  id: string;
  name: string;
  displayName: string;
  indexed: boolean;
  required: boolean;
  type: ColumnKind;
}

export interface NewColumn {
  name: string;
  displayName: string;
  type: ColumnType;
  indexed: boolean;
  choices?: string[];
}

interface GraphColumn {
  id: string;
  name: string;
  displayName: string;
  indexed?: boolean;
  required?: boolean;
  text?: { allowMultipleLines?: boolean };
  number?: unknown;
  currency?: unknown;
  dateTime?: unknown;
  boolean?: unknown;
  choice?: { displayAs?: string };
  hyperlinkOrPicture?: { isPicture?: boolean };
  calculated?: unknown;
  contentApprovalStatus?: unknown;
  geolocation?: unknown;
  lookup?: unknown;
  personOrGroup?: unknown;
  term?: unknown;
  thumbnail?: unknown;
}

const OTHER_TYPE_FACETS: (keyof GraphColumn)[] = [
  'calculated',
  'contentApprovalStatus',
  'geolocation',
  'lookup',
  'personOrGroup',
  'term',
  'thumbnail',
];

function kindOf(column: GraphColumn): ColumnKind {
  if (column.text) {
    return column.text.allowMultipleLines ? 'multilineText' : 'text';
  }
  if (column.number || column.currency) {
    return 'number';
  }
  if (column.dateTime) {
    return 'dateTime';
  }
  if (column.boolean) {
    return 'boolean';
  }
  if (column.choice) {
    return column.choice.displayAs === 'checkBoxes' ? 'multiChoice' : 'choice';
  }
  if (column.hyperlinkOrPicture && !column.hyperlinkOrPicture.isPicture) {
    return 'hyperlink';
  }
  return OTHER_TYPE_FACETS.some((facet) => column[facet]) ? 'other' : 'unknown';
}

function facetFor({ type, choices }: NewColumn): Record<string, unknown> {
  switch (type) {
    case 'text':
      return { text: {} };
    case 'multilineText':
      return { text: { allowMultipleLines: true } };
    case 'number':
      return { number: {} };
    case 'dateTime':
      return { dateTime: { format: 'dateTime' } };
    case 'boolean':
      return { boolean: {} };
    case 'multiChoice':
      return { choice: { allowTextEntry: true, choices: choices ?? [], displayAs: 'checkBoxes' } };
    case 'hyperlink':
      return { hyperlinkOrPicture: { isPicture: false } };
  }
}

export class GraphClient {
  constructor(private graphUrl: string) {}

  private siteUrl(siteId: string): string {
    return `${this.graphUrl.replace(/\/$/, '')}/sites/${encodeSegment(siteId)}`;
  }

  private listUrl(siteId: string, listId: string): string {
    return `${this.siteUrl(siteId)}/lists/${encodeSegment(listId)}`;
  }

  private itemsUrl(siteId: string, listId: string): string {
    return `${this.listUrl(siteId, listId)}/items`;
  }

  private headers(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  private writeHeaders(token: string) {
    return { ...this.headers(token), Prefer: 'apiversion=2.1' };
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
          $filter: filterEquals(keyColumn, key),
          $select: 'id',
        },
      });
      return data.value[0]?.id ?? null;
    } catch (err) {
      throw toSharePointError(err);
    }
  }

  async findItemIdsByField(
    token: string,
    siteId: string,
    listId: string,
    column: string,
    value: string,
  ): Promise<string[]> {
    try {
      const ids: string[] = [];
      let { data } = await axios.get<ItemIdPage>(this.itemsUrl(siteId, listId), {
        headers: this.headers(token),
        params: { $filter: filterEquals(column, value), $select: 'id' },
      });
      ids.push(...data.value.map(({ id }) => id));
      while (data['@odata.nextLink']) {
        // Only follow pages on Graph itself so the token is never sent elsewhere.
        if (new URL(data['@odata.nextLink']).origin !== new URL(this.graphUrl).origin) {
          throw new SharePointError('graph:invalidNextLink', false);
        }
        ({ data } = await axios.get<ItemIdPage>(data['@odata.nextLink'], { headers: this.headers(token) }));
        ids.push(...data.value.map(({ id }) => id));
      }
      return ids;
    } catch (err) {
      throw toSharePointError(err);
    }
  }

  async deleteItem(token: string, siteId: string, listId: string, itemId: string): Promise<void> {
    try {
      await axios.delete(`${this.itemsUrl(siteId, listId)}/${encodeSegment(itemId)}`, {
        headers: this.headers(token),
      });
    } catch (err) {
      const error = toSharePointError(err);
      if (error.errorCode !== 'graph:itemNotFound') {
        throw error;
      }
    }
  }

  async createItem(token: string, siteId: string, listId: string, fields: Record<string, unknown>): Promise<string> {
    try {
      const { data } = await axios.post<{ id: string }>(
        this.itemsUrl(siteId, listId),
        { fields },
        { headers: this.writeHeaders(token) },
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
        headers: this.writeHeaders(token),
      });
    } catch (err) {
      throw toSharePointError(err);
    }
  }

  // Column definitions only: list rows are never read here.
  async getListColumns(token: string, siteId: string, listId: string): Promise<ListColumn[]> {
    const { data } = await requestWithRetry(() =>
      axios.get<{ value: GraphColumn[] }>(`${this.listUrl(siteId, listId)}/columns`, { headers: this.headers(token) }),
    );
    return data.value.map((column) => ({
      id: column.id,
      name: column.name,
      displayName: column.displayName,
      indexed: !!column.indexed,
      required: !!column.required,
      type: kindOf(column),
    }));
  }

  async findListIdByName(token: string, siteId: string, displayName: string): Promise<string | null> {
    const { data } = await requestWithRetry(() =>
      axios.get<{ value: { id: string }[] }>(`${this.siteUrl(siteId)}/lists`, {
        headers: this.headers(token),
        params: { $filter: `displayName eq '${displayName.replace(/'/g, "''")}'`, $select: 'id,displayName' },
      }),
    );
    return data.value[0]?.id ?? null;
  }

  // Creates are only repeated when SharePoint refused them; after a timeout the list may already exist.
  async createList(
    token: string,
    siteId: string,
    displayName: string,
    template: 'genericList' | 'documentLibrary' = 'genericList',
  ): Promise<string> {
    const { data } = await requestWithRetry(
      () =>
        axios.post<{ id: string }>(
          `${this.siteUrl(siteId)}/lists`,
          { displayName, list: { template } },
          { headers: this.writeHeaders(token) },
        ),
      isRefused,
    );
    return data.id;
  }

  // SharePoint takes the internal name from the display name a column is created with, so that is set afterwards.
  async createColumn(token: string, siteId: string, listId: string, column: NewColumn): Promise<void> {
    const { data } = await requestWithRetry(
      () =>
        axios.post<{ id: string }>(
          `${this.listUrl(siteId, listId)}/columns`,
          { name: column.name, displayName: column.name, indexed: column.indexed, ...facetFor(column) },
          { headers: this.writeHeaders(token) },
        ),
      isRefused,
    );
    if (column.displayName !== column.name) {
      await this.updateColumn(token, siteId, listId, data.id, { displayName: column.displayName });
    }
  }

  async updateColumn(
    token: string,
    siteId: string,
    listId: string,
    columnId: string,
    changes: { indexed?: boolean; required?: boolean; displayName?: string },
  ): Promise<void> {
    await requestWithRetry(() =>
      axios.patch(`${this.listUrl(siteId, listId)}/columns/${encodeSegment(columnId)}`, changes, {
        headers: this.writeHeaders(token),
      }),
    );
  }
}
