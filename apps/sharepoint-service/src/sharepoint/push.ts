import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { runLimited } from './concurrency';
import { valueAtPath } from './dataPath';
import { resolveDestination } from './destinations';
import { DestinationDisabledError, DestinationNotSetUpError, DetailRowsFailedError, SharePointError } from './errors';
import { GraphClient, GraphTokenProvider } from './graph';
import { ITEM_KEY_COLUMN, itemKeyFor, mapFields } from './mapper';
import { isRefused, isTransient, withRetry } from './retry';
import {
  DetailFailure,
  DetailList,
  DetailRows,
  PushResult,
  SharePointConfiguration,
  SharePointConnection,
  SharePointDestination,
} from './types';
import { withToken } from './withToken';

export const MAX_DETAIL_ROWS = 100;
const DETAIL_CONCURRENCY = 3;

export interface HyperlinkValue {
  Url: string;
  Description: string;
}

export interface PushOptions {
  folderLink?: HyperlinkValue;
  // Sets only the main row's columns that are in the data, on a row that must already exist; detail rows are kept.
  updateRowOnly?: boolean;
}

interface PreparedDetailList {
  list: DetailList & { listId: string };
  items: Record<string, unknown>[];
}

interface DetailListOutcome {
  rows: DetailRows;
  failure?: DetailFailure;
  errors?: SharePointError[];
}

export function prepareDetailLists(
  destination: SharePointDestination,
  data: Record<string, unknown>,
): PreparedDetailList[] {
  const detailLists = destination.detailLists ?? [];
  if (detailLists.length && !destination.idempotencyFields?.length) {
    throw new InvalidOperationError(
      `SharePoint destination '${destination.id}' has detail lists, so it needs row identity.`,
    );
  }
  if (detailLists.some(({ listId }) => !listId)) {
    throw new DestinationNotSetUpError(destination.id);
  }
  return detailLists.map((list) => {
    const value = valueAtPath(data, list.dataPath);
    if (value !== undefined && value !== null && !Array.isArray(value)) {
      throw new InvalidOperationError(`Data at '${list.dataPath}' must be a list.`);
    }
    const items = (value ?? []) as Record<string, unknown>[];
    if (items.length > MAX_DETAIL_ROWS) {
      throw new InvalidOperationError(`Data at '${list.dataPath}' has more than ${MAX_DETAIL_ROWS} items.`);
    }
    return { list: list as PreparedDetailList['list'], items };
  });
}

function detailFields(list: DetailList, item: Record<string, unknown>, parentId: string): Record<string, unknown> {
  const fields = mapFields(list.fieldMappings, item, null);
  delete fields[`${list.parentRefField}@odata.type`];
  return { ...fields, [list.parentRefField]: parentId };
}

export class SharePointPusher {
  constructor(
    private tokens: GraphTokenProvider,
    private graph: GraphClient,
  ) {}

  async push(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
    data: Record<string, unknown>,
    options: PushOptions = {},
  ): Promise<PushResult> {
    const { destination, connection } = resolveDestination(configuration, destinationId);
    if (destination.enabled === false) {
      throw new DestinationDisabledError(destinationId);
    }
    return this.write(tenantId, connection, destination, data, options);
  }

  async test(
    tenantId: AdspId,
    configuration: SharePointConfiguration | undefined,
    destinationId: string,
    data: Record<string, unknown>,
  ): Promise<PushResult> {
    const { destination, connection } = resolveDestination(configuration, destinationId);
    return this.write(tenantId, connection, destination, data, {});
  }

  private async write(
    tenantId: AdspId,
    connection: SharePointConnection,
    destination: SharePointDestination,
    data: Record<string, unknown>,
    { folderLink, updateRowOnly }: PushOptions,
  ): Promise<PushResult> {
    const key = itemKeyFor(destination.idempotencyFields, data);
    const fields = mapFields(destination.fieldMappings, data, key);
    if (folderLink && destination.folderLinkField) {
      fields[destination.folderLinkField] = folderLink;
    }

    if (updateRowOnly) {
      if (key === null) {
        throw new SharePointError('row-identity-missing', false);
      }
      return this.request(tenantId, connection, isTransient, (token) =>
        this.updateExistingRow(token, connection, destination, key, fields),
      );
    }

    const detailLists = prepareDetailLists(destination, data);

    // With a key, a repeat looks the row up again, so a create that actually succeeded becomes an update.
    // Without one, a create is only repeated when SharePoint refused it, since the row may already exist after a timeout.
    const main = await this.request(tenantId, connection, key === null ? isRefused : isTransient, (token) =>
      this.writeMainRow(token, connection, destination, key, fields),
    );
    if (!detailLists.length) {
      return main;
    }

    const outcomes: DetailListOutcome[] = [];
    for (const prepared of detailLists) {
      outcomes.push(await this.writeDetailList(tenantId, connection, prepared, main));
    }
    const failed = outcomes.filter(({ failure }) => failure);
    if (failed.length) {
      const errors = failed.flatMap((outcome) => outcome.errors);
      throw new DetailRowsFailedError(
        main.itemId,
        main.outcome,
        failed.map(({ failure }) => failure),
        errors[0].errorCode,
        errors.every(({ retryable }) => retryable),
      );
    }
    return { ...main, detailRows: outcomes.map(({ rows }) => rows) };
  }

  private request<T>(
    tenantId: AdspId,
    connection: SharePointConnection,
    shouldRetry: (err: unknown) => boolean,
    call: (token: string) => Promise<T>,
  ): Promise<T> {
    return withRetry(() => withToken(this.tokens, tenantId, connection, call), shouldRetry);
  }

  private async writeMainRow(
    token: string,
    connection: SharePointConnection,
    destination: SharePointDestination,
    key: string | null,
    fields: Record<string, unknown>,
  ): Promise<PushResult> {
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

  // The row comes from another push, which may not have arrived yet; retrying later lets it land first.
  private async updateExistingRow(
    token: string,
    connection: SharePointConnection,
    destination: SharePointDestination,
    key: string,
    fields: Record<string, unknown>,
  ): Promise<PushResult> {
    const itemId = await this.graph.findItemIdByKey(token, connection.siteId, destination.listId, ITEM_KEY_COLUMN, key);
    if (!itemId) {
      throw new SharePointError('row-not-found', true);
    }
    await this.graph.updateItemFields(token, connection.siteId, destination.listId, itemId, fields);
    return { itemId, outcome: 'updated' };
  }

  // New rows are written before old ones are deleted; if any new row fails, the old ones stay and the new ones go.
  private async writeDetailList(
    tenantId: AdspId,
    connection: SharePointConnection,
    { list, items }: PreparedDetailList,
    main: PushResult,
  ): Promise<DetailListOutcome> {
    const { siteId } = connection;
    const sharePointErrorOrThrow = (err: unknown): SharePointError => {
      if (err instanceof SharePointError) {
        return err;
      }
      throw err;
    };

    let oldRowIds: string[] = [];
    if (main.outcome === 'updated') {
      try {
        oldRowIds = await this.request(tenantId, connection, isTransient, (token) =>
          this.graph.findItemIdsByField(token, siteId, list.listId, list.parentRefField, main.itemId),
        );
      } catch (err) {
        const error = sharePointErrorOrThrow(err);
        const indexes = items.map((_item, index) => index);
        return {
          rows: { listId: list.listId, rowIds: [] },
          failure: { listId: list.listId, indexes, ...(error.column ? { column: error.column } : {}) },
          errors: [error],
        };
      }
    }

    const results = await runLimited(items, DETAIL_CONCURRENCY, async (item) => {
      try {
        const fields = detailFields(list, item, main.itemId);
        // A detail row has no key of its own, so its create is only repeated when SharePoint refused it.
        return {
          rowId: await this.request(tenantId, connection, isRefused, (token) =>
            this.graph.createItem(token, siteId, list.listId, fields),
          ),
        };
      } catch (err) {
        return { error: sharePointErrorOrThrow(err) };
      }
    });
    const rowIds = results.filter(({ rowId }) => rowId).map(({ rowId }) => rowId);
    const deleteRows = async (ids: string[]): Promise<SharePointError[]> => {
      const deletions = await runLimited(ids, DETAIL_CONCURRENCY, async (rowId) => {
        try {
          await this.request(tenantId, connection, isTransient, (token) =>
            this.graph.deleteItem(token, siteId, list.listId, rowId),
          );
          return null;
        } catch (err) {
          return sharePointErrorOrThrow(err);
        }
      });
      return deletions.filter((error) => error);
    };

    const failedIndexes = results.flatMap(({ error }, index) => (error ? [index] : []));
    if (failedIndexes.length) {
      // Removing this attempt's rows leaves the list exactly as it was, so it never shows a mix of old and new items.
      const leftErrors = await deleteRows(rowIds);
      const column = failedIndexes.map((index) => results[index].error.column).find(Boolean);
      return {
        rows: { listId: list.listId, rowIds: [] },
        failure: {
          listId: list.listId,
          indexes: failedIndexes,
          ...(leftErrors.length ? { newRowsLeft: leftErrors.length } : {}),
          ...(column ? { column } : {}),
        },
        errors: [...failedIndexes.map((index) => results[index].error), ...leftErrors],
      };
    }

    const deleteErrors = await deleteRows(oldRowIds);
    if (deleteErrors.length) {
      return {
        rows: { listId: list.listId, rowIds },
        failure: { listId: list.listId, indexes: [], oldRowsLeft: deleteErrors.length },
        errors: deleteErrors,
      };
    }
    return { rows: { listId: list.listId, rowIds } };
  }
}
