import { AdspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { SharePointError } from './errors';
import { ColumnKind, GraphClient, GraphTokenProvider, ListColumn } from './graph';
import { ITEM_KEY_COLUMN } from './mapper';
import {
  ColumnType,
  FieldMapping,
  SharePointConfiguration,
  SharePointConnection,
  SharePointDestination,
} from './types';
import { withToken } from './withToken';

export type ColumnPurpose = 'key' | 'parent' | 'folder' | 'mapped';
export type ColumnStatus = 'ok' | 'missing' | 'notIndexed' | 'wrongType';
export type ListStatus = 'ok' | 'notCreated' | 'notFound';

export interface ColumnReport {
  name: string;
  displayName: string;
  purpose: ColumnPurpose;
  expectedType?: ColumnType;
  status: ColumnStatus;
  actualType?: ColumnKind;
  matchingName?: string;
}

export interface ListReport {
  kind: 'main' | 'detail';
  listId?: string;
  listName?: string;
  dataPath?: string;
  status: ListStatus;
  columns: ColumnReport[];
}

export interface VerifyResult {
  ready: boolean;
  lists: ListReport[];
}

export interface CreatedList {
  index: number;
  dataPath: string;
  listName: string;
  listId: string;
}

export interface SetupResult {
  createdLists: CreatedList[];
  createdColumns: { listId: string; name: string }[];
  indexedColumns: { listId: string; name: string }[];
  failures: { listId?: string; name?: string; errorCode: string }[];
  permissionDenied: boolean;
  report: VerifyResult;
}

export class ListNameTakenError extends Error {
  constructor(public readonly lists: CreatedList[]) {
    super('A list with the same name already exists on the site.');
    Object.setPrototypeOf(this, ListNameTakenError.prototype);
  }
}

class PermissionDeniedError extends Error {}

interface ExpectedColumn {
  name: string;
  displayName: string;
  purpose: ColumnPurpose;
  type?: ColumnType;
  indexed: boolean;
  choices?: string[];
}

interface PlannedList {
  kind: 'main' | 'detail';
  index?: number;
  listId?: string;
  listName?: string;
  dataPath?: string;
  columns: ExpectedColumn[];
}

const VALID_COLUMN_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

const COMPATIBLE: Record<ColumnType, ColumnKind[]> = {
  text: ['text', 'multilineText', 'choice'],
  multilineText: ['multilineText', 'text'],
  number: ['number'],
  dateTime: ['dateTime'],
  boolean: ['boolean'],
  multiChoice: ['multiChoice'],
  // Graph lists Hyperlink columns without any type information.
  hyperlink: ['hyperlink', 'unknown'],
};

function expectedColumns(mappings: FieldMapping[], fixed: ExpectedColumn[]): ExpectedColumn[] {
  const columns = [...fixed];
  for (const { target, displayName, columnType, choices } of mappings) {
    if (columns.some(({ name }) => name === target)) {
      continue;
    }
    columns.push({
      name: target,
      displayName: displayName ?? target,
      purpose: 'mapped',
      type: columnType,
      indexed: false,
      ...(columnType === 'multiChoice' && choices ? { choices } : {}),
    });
  }
  return columns;
}

function planLists(destination: SharePointDestination, detailListIds: Map<number, string>): PlannedList[] {
  const keyColumn = (name: string, purpose: ColumnPurpose): ExpectedColumn => ({
    name,
    displayName: name,
    purpose,
    type: 'text',
    indexed: true,
  });
  const mainFixed: ExpectedColumn[] = [
    ...(destination.idempotencyFields?.length ? [keyColumn(ITEM_KEY_COLUMN, 'key')] : []),
    ...(destination.folderLinkField
      ? [
          {
            name: destination.folderLinkField,
            displayName: destination.folderLinkField,
            purpose: 'folder' as const,
            type: 'hyperlink' as const,
            indexed: false,
          },
        ]
      : []),
  ];
  return [
    {
      kind: 'main',
      listId: destination.listId,
      columns: expectedColumns(
        destination.fieldMappings.filter(({ target }) => target !== ITEM_KEY_COLUMN),
        mainFixed,
      ),
    },
    ...(destination.detailLists ?? []).map((list, index) => ({
      kind: 'detail' as const,
      index,
      listId: list.listId ?? detailListIds.get(index),
      listName: list.listName,
      dataPath: list.dataPath,
      columns: expectedColumns(
        list.fieldMappings.filter(({ target }) => target !== list.parentRefField),
        [keyColumn(list.parentRefField, 'parent')],
      ),
    })),
  ];
}

function checkColumn(expected: ExpectedColumn, existing: ListColumn[]): ColumnReport {
  const { name, displayName, purpose, type } = expected;
  const report: ColumnReport = { name, displayName, purpose, ...(type ? { expectedType: type } : {}), status: 'ok' };
  const column = existing.find((candidate) => candidate.name === name);
  if (!column) {
    const matching = existing.find((candidate) => candidate.displayName.toLowerCase() === name.toLowerCase());
    return { ...report, status: 'missing', ...(matching ? { matchingName: matching.name } : {}) };
  }
  if (type && !COMPATIBLE[type].includes(column.type)) {
    return { ...report, status: 'wrongType', actualType: column.type };
  }
  if (expected.indexed && !column.indexed) {
    return { ...report, status: 'notIndexed' };
  }
  return report;
}

export class SharePointSetup {
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

  private call<T>(tenantId: AdspId, connection: SharePointConnection, call: (token: string) => Promise<T>) {
    return withToken(this.tokens, tenantId, connection, call);
  }

  private async columnsOf(
    tenantId: AdspId,
    connection: SharePointConnection,
    listId: string,
  ): Promise<ListColumn[] | null> {
    try {
      return await this.call(tenantId, connection, (token) =>
        this.graph.getListColumns(token, connection.siteId, listId),
      );
    } catch (err) {
      if (err instanceof SharePointError && err.errorCode === 'graph:itemNotFound') {
        return null;
      }
      throw err;
    }
  }

  private async check(
    tenantId: AdspId,
    connection: SharePointConnection,
    planned: PlannedList[],
  ): Promise<{ report: VerifyResult; existing: Map<string, ListColumn[]> }> {
    const existing = new Map<string, ListColumn[]>();
    const lists: ListReport[] = [];
    for (const { kind, listId, listName, dataPath, columns } of planned) {
      const identity = {
        kind,
        ...(listId ? { listId } : {}),
        ...(listName ? { listName } : {}),
        ...(dataPath ? { dataPath } : {}),
      };
      const listColumns = listId ? await this.columnsOf(tenantId, connection, listId) : null;
      if (!listColumns) {
        lists.push({
          ...identity,
          status: listId ? 'notFound' : 'notCreated',
          columns: columns.map((column) => checkColumn(column, [])),
        });
        continue;
      }
      existing.set(listId, listColumns);
      lists.push({ ...identity, status: 'ok', columns: columns.map((column) => checkColumn(column, listColumns)) });
    }
    const ready = lists.every(({ status, columns }) => status === 'ok' && columns.every((c) => c.status === 'ok'));
    return { report: { ready, lists }, existing };
  }

  async verify(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
  ): Promise<VerifyResult> {
    const { destination, connection } = this.resolve(configuration, destinationId);
    return (await this.check(tenantId, connection, planLists(destination, new Map()))).report;
  }

  async setUp(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
  ): Promise<SetupResult> {
    const { destination, connection } = this.resolve(configuration, destinationId);
    const { siteId } = connection;
    const result: Omit<SetupResult, 'report'> = {
      createdLists: [],
      createdColumns: [],
      indexedColumns: [],
      failures: [],
      permissionDenied: false,
    };
    const detailListIds = new Map<number, string>();

    // Any refusal means the app's grant can't change lists or columns, so nothing else would succeed.
    const change = async (call: (token: string) => Promise<unknown>) => {
      try {
        await this.call(tenantId, connection, call);
        return null;
      } catch (err) {
        if (err instanceof SharePointError && err.errorCode === 'graph:accessDenied') {
          throw new PermissionDeniedError();
        }
        if (err instanceof SharePointError) {
          return err.errorCode;
        }
        throw err;
      }
    };

    try {
      const toCreate = planLists(destination, new Map()).filter(({ kind, listId }) => kind === 'detail' && !listId);
      // Never reuse a list by name: two detail lists sharing a list would replace each other's rows.
      const taken: CreatedList[] = [];
      for (const { index, dataPath, listName } of toCreate) {
        const name = listName ?? dataPath;
        const existingId = await this.call(tenantId, connection, (token) =>
          this.graph.findListIdByName(token, siteId, name),
        );
        if (existingId) {
          taken.push({ index, dataPath, listName: name, listId: existingId });
        }
      }
      if (taken.length) {
        throw new ListNameTakenError(taken);
      }

      for (const { index, dataPath, listName } of toCreate) {
        const name = listName ?? dataPath;
        let listId: string | undefined;
        await change(async (token) => {
          listId = await this.graph.createList(token, siteId, name);
        });
        if (!listId) {
          result.failures.push({ name, errorCode: 'list-not-created' });
          continue;
        }
        const title = (await this.columnsOf(tenantId, connection, listId))?.find(({ name }) => name === 'Title');
        if (title?.required) {
          const failed = await change((token) =>
            this.graph.updateColumn(token, siteId, listId, title.id, { required: false }),
          );
          if (failed) {
            result.failures.push({ listId, name: 'Title', errorCode: failed });
          }
        }
        detailListIds.set(index, listId);
        result.createdLists.push({ index, dataPath, listName: name, listId });
      }

      const planned = planLists(destination, detailListIds);
      const { report, existing } = await this.check(tenantId, connection, planned);
      const work = planned.flatMap((list, position) =>
        list.listId && report.lists[position].status === 'ok'
          ? report.lists[position].columns.map((column, i) => ({
              listId: list.listId,
              column,
              expected: list.columns[i],
            }))
          : [],
      );

      for (const { listId, column, expected } of work.filter(({ column }) => column.status === 'missing')) {
        if (!VALID_COLUMN_NAME.test(expected.name)) {
          result.failures.push({ listId, name: expected.name, errorCode: 'invalid-column-name' });
          continue;
        }
        const failed = await change((token) =>
          this.graph.createColumn(token, siteId, listId, {
            name: expected.name,
            displayName: expected.displayName,
            type: expected.type ?? 'text',
            indexed: expected.indexed,
            ...(expected.choices ? { choices: expected.choices } : {}),
          }),
        );
        if (failed && failed !== 'graph:nameAlreadyExists') {
          result.failures.push({ listId, name: column.name, errorCode: failed });
        } else {
          result.createdColumns.push({ listId, name: column.name });
        }
      }

      for (const { listId, column } of work.filter(({ column }) => column.status === 'notIndexed')) {
        const columnId = existing.get(listId).find(({ name }) => name === column.name).id;
        const failed = await change((token) =>
          this.graph.updateColumn(token, siteId, listId, columnId, { indexed: true }),
        );
        if (failed) {
          result.failures.push({ listId, name: column.name, errorCode: failed });
        } else {
          result.indexedColumns.push({ listId, name: column.name });
        }
      }
    } catch (err) {
      if (!(err instanceof PermissionDeniedError)) {
        throw err;
      }
      result.permissionDenied = true;
    }

    const { report } = await this.check(tenantId, connection, planLists(destination, detailListIds));
    return { ...result, report };
  }
}
