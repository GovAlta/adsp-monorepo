export interface ReviewField {
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

const collectFields = (schema: SchemaNode, path: string[]): ReviewField[] => {
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

export const flattenReviewFields = (schema: unknown): ReviewField[] => {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  return collectFields(schema as SchemaNode, []);
};

export const reviewFieldLabel = (field: Pick<ReviewField, 'name' | 'path'>): string => `${field.name} (${field.path})`;

export const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export const setItemOrder = <T>(items: T[], from: number, nextOrder: number): T[] => {
  if (!Number.isFinite(nextOrder)) {
    return items;
  }

  const target = Math.min(Math.max(Math.round(nextOrder), 1), items.length) - 1;
  return moveItem(items, from, target);
};
