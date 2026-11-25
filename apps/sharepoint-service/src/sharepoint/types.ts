export interface SharePointConnection {
  id: string;
  name: string;
  entraTenantId: string;
  clientId: string;
  siteId: string;
}

export type ColumnType = 'text' | 'multilineText' | 'number' | 'dateTime' | 'boolean' | 'multiChoice' | 'hyperlink';

export interface FieldMapping {
  source: string;
  target: string;
  linkFormat?: LinkFormat;
  columnType?: ColumnType;
  displayName?: string;
  choices?: string[];
}

export type LinkFormat = 'hyperlink' | 'text';

export interface DetailList {
  listId?: string;
  listName?: string;
  dataPath: string;
  parentRefField: string;
  fieldMappings: FieldMapping[];
}

export interface SharePointDestination {
  id: string;
  name: string;
  connectionId: string;
  listId: string;
  fieldMappings: FieldMapping[];
  idempotencyFields?: string[];
  enabled?: boolean;
  folderLinkField?: string;
  // List ID of the document library for uploaded files; the site's default library when unset.
  documentFilesLibraryId?: string;
  // Setup creates a document library with this name when there is no library ID yet.
  documentFilesLibraryName?: string;
  detailLists?: DetailList[];
}

export interface SharePointConfiguration {
  connections?: Record<string, SharePointConnection>;
  destinations?: Record<string, SharePointDestination>;
}

export type PushOutcome = 'created' | 'updated';

export interface DetailRows {
  listId: string;
  rowIds: string[];
}

export interface DetailFailure {
  listId: string;
  indexes: number[];
  oldRowsLeft?: number;
  newRowsLeft?: number;
  column?: string;
}

export interface PushResult {
  itemId: string;
  outcome: PushOutcome;
  detailRows?: DetailRows[];
}

export type TestResult =
  | { ok: true; outcome: PushOutcome; detailRows?: DetailRows[] }
  | { ok: false; errorCode: string; column?: string; detailFailures?: DetailFailure[] };
