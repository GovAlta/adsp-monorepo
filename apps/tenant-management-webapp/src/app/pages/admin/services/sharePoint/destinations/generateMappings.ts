import { SharepointColumnType, SharepointDetailList, SharepointFieldMapping } from '@store/sharePoint/actions';

export const FOLDER_LINK_COLUMN = 'AdspFilesFolder';
export const PARENT_REF_COLUMN = 'ParentItemId';
// Form Service pushes the PDF it generates on submit to this field, once the submission's row is there.
const SUBMISSION_PDF_SOURCE = '_adsp.submissionPdf';
const FILE_FORMAT = 'file-urn';
const MAX_COLUMN_NAME = 32;

// SharePoint's own columns, plus the ones ADSP sets itself.
const RESERVED_NAMES = new Set(
  [
    'ID',
    'Created',
    'Modified',
    'Author',
    'Editor',
    'ContentType',
    'Attachments',
    'GUID',
    'Version',
    'AdspItemKey',
    PARENT_REF_COLUMN,
    FOLDER_LINK_COLUMN,
  ].map((name) => name.toLowerCase()),
);

type Schema = Record<string, unknown> & {
  type?: string | string[];
  format?: string;
  title?: string;
  enum?: unknown[];
  oneOf?: { const?: unknown }[];
  items?: Schema;
  properties?: Record<string, Schema>;
  allOf?: Schema[];
  $ref?: string;
};

export interface GeneratedMappings {
  fieldMappings: SharepointFieldMapping[];
  detailLists: SharepointDetailList[];
  folderLinkField?: string;
}

const words = (value: string): string[] =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

const humanize = (segments: string[]): string => {
  const text = segments.flatMap(words).join(' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const pascalCase = (segments: string[]): string =>
  segments
    .flatMap(words)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

class ColumnNames {
  private used = new Set<string>();

  take(segments: string[]): string {
    let base = pascalCase(segments) || 'Field';
    if (/^[0-9]/.test(base)) {
      base = `F${base}`;
    }
    if (RESERVED_NAMES.has(base.toLowerCase())) {
      base = `${base}Value`;
    }
    let candidate = base.slice(0, MAX_COLUMN_NAME);
    for (let counter = 2; this.used.has(candidate.toLowerCase()); counter++) {
      candidate = `${base.slice(0, MAX_COLUMN_NAME - String(counter).length)}${counter}`;
    }
    this.used.add(candidate.toLowerCase());
    return candidate;
  }
}

function resolve(schema: Schema | undefined, root: Schema): Schema | undefined {
  if (!schema || typeof schema !== 'object') {
    return undefined;
  }
  if (schema.$ref) {
    const match = /^#\/(definitions|\$defs)\/(.+)$/.exec(schema.$ref);
    const target = match ? (root[match[1]] as Record<string, Schema> | undefined)?.[match[2]] : undefined;
    return target && target !== schema ? resolve(target, root) : undefined;
  }
  if (schema.allOf?.length) {
    const parts = schema.allOf.map((part) => resolve(part, root)).filter(Boolean);
    return {
      ...schema,
      properties: Object.assign({}, ...parts.map((part) => part.properties ?? {}), schema.properties ?? {}),
    };
  }
  return schema;
}

const typesOf = (schema: Schema): string[] => (Array.isArray(schema.type) ? schema.type : [schema.type]);

function scalarType(schema: Schema): SharepointColumnType | null {
  const types = typesOf(schema);
  if (schema.format === FILE_FORMAT) {
    return 'hyperlink';
  }
  if (types.includes('number') || types.includes('integer')) {
    return 'number';
  }
  if (types.includes('boolean')) {
    return 'boolean';
  }
  if (types.includes('string')) {
    return schema.format === 'date' || schema.format === 'date-time' ? 'dateTime' : 'text';
  }
  return null;
}

interface Walk {
  root: Schema;
  names: ColumnNames;
  mappings: SharepointFieldMapping[];
  detailLists?: SharepointDetailList[];
  files: { found: boolean };
}

function walk(schema: Schema, path: string[], context: Walk): void {
  for (const [key, property] of Object.entries(schema.properties ?? {})) {
    if (path.length === 0 && key === '_adsp') {
      continue;
    }
    const resolved = resolve(property, context.root);
    if (!resolved) {
      continue;
    }
    const segments = [...path, key];
    const types = typesOf(resolved);

    if (resolved.properties || types.includes('object')) {
      walk(resolved, segments, context);
      continue;
    }

    if (types.includes('array')) {
      const items = resolve(resolved.items, context.root);
      if (!items) {
        continue;
      }
      if (items.format === FILE_FORMAT) {
        context.files.found = true;
      } else if (items.properties || typesOf(items).includes('object')) {
        // A repeating section becomes a detail list; one inside another is out of scope.
        if (context.detailLists) {
          const detail: Walk = { ...context, names: new ColumnNames(), mappings: [], detailLists: undefined };
          walk(items, [], detail);
          context.detailLists.push({
            listName: resolved.title ?? items.title ?? humanize([key]),
            dataPath: segments.join('.'),
            parentRefField: PARENT_REF_COLUMN,
            fieldMappings: detail.mappings,
          });
        }
      } else if (scalarType(items)) {
        const options = items.enum ?? (items.oneOf ?? []).map((option) => option.const);
        const choices = options.filter((choice): choice is string => typeof choice === 'string');
        context.mappings.push({
          source: segments.join('.'),
          target: context.names.take(segments),
          displayName: resolved.title ?? humanize(segments),
          columnType: 'multiChoice',
          ...(choices.length ? { choices } : {}),
        });
      }
      continue;
    }

    const columnType = scalarType(resolved);
    if (!columnType) {
      continue;
    }
    if (columnType === 'hyperlink') {
      context.files.found = true;
    }
    context.mappings.push({
      source: segments.join('.'),
      target: context.names.take(segments),
      displayName: resolved.title ?? humanize(segments),
      columnType,
    });
  }
}

export function generateFormServiceMappings(
  dataSchema: Record<string, unknown> | undefined,
  { submissionPdf = false }: { submissionPdf?: boolean } = {},
): GeneratedMappings {
  const root = (dataSchema ?? {}) as Schema;
  const resolved = resolve(root, root);
  const context: Walk = { root, names: new ColumnNames(), mappings: [], detailLists: [], files: { found: false } };
  if (resolved) {
    walk(resolved, [], context);
  }
  if (submissionPdf) {
    context.files.found = true;
    context.mappings.push({
      source: SUBMISSION_PDF_SOURCE,
      target: context.names.take(['submissionPdf']),
      displayName: 'Submission PDF',
      columnType: 'hyperlink',
    });
  }
  return {
    fieldMappings: context.mappings,
    detailLists: context.detailLists,
    ...(context.files.found ? { folderLinkField: FOLDER_LINK_COLUMN } : {}),
  };
}
