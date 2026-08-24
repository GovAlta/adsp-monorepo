export interface ReviewColumnValue {
  name: string;
  path: string;
  type?: string | string[];
}

interface SchemaNode {
  type?: string | string[];
  title?: string;
  properties?: Record<string, SchemaNode>;
}

const isObjectSchema = (schema: SchemaNode): boolean =>
  schema.type === 'object' || (!schema.type && !!schema.properties);

const fieldName = (schema: SchemaNode, path: string[]): string =>
  typeof schema.title === 'string' && schema.title.trim() ? schema.title : path[path.length - 1];

const collectFields = (schema: SchemaNode, path: string[]): ReviewColumnValue[] => {
  if (isObjectSchema(schema) && schema.properties) {
    return Object.entries(schema.properties).flatMap(([propertyName, child]) =>
      child ? collectFields(child, [...path, propertyName]) : [],
    );
  }

  if (path.length === 0) {
    return [];
  }

  return [{ name: fieldName(schema, path), path: path.join('.'), type: schema.type }];
};

export const flattenReviewFields = (schema: unknown): ReviewColumnValue[] => {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  return collectFields(schema as SchemaNode, []);
};

const pathLabel = (path: string): string => {
  const segments = path.split('.');
  return segments[segments.length - 1] || path;
};

export const resolveReviewColumns = (
  schema: unknown,
  reviewConfiguration?: { columns?: Array<{ path: string }> },
): ReviewColumnValue[] => {
  const columns = reviewConfiguration?.columns;
  if (!columns?.length) {
    return [];
  }

  const fieldsByPath = Object.fromEntries(flattenReviewFields(schema).map((field) => [field.path, field]));

  return columns.map(({ path }) => fieldsByPath[path] ?? { name: pathLabel(path), path });
};
