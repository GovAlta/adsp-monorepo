import { JsonSchema, UISchemaElement, hasType, isControl } from '@jsonforms/core';

export const isNullSchema = (schema: unknown): boolean => {
  return schema === undefined || schema === null;
};

export const isValidScope = (uiSchema: UISchemaElement, schema: JsonSchema): boolean => {
  if (!('scope' in uiSchema) || typeof uiSchema.scope !== 'string') {
    return false;
  }

  const scopeStr = uiSchema.scope;

  if (scopeStr === '#') return true;

  const scopeComponents = scopeStr.split('/');
  if (scopeComponents[0] === '#') scopeComponents.shift();

  let obj: unknown = schema;

  for (const key of scopeComponents) {
    if (!isRecord(obj) || !(key in obj)) {
      return false;
    }
    obj = obj[key];
  }

  return true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export const isLayoutType = (schema: UISchemaElement): boolean => {
  return (
    hasType(schema, 'VerticalLayout') ||
    hasType(schema, 'HorizontalLayout') ||
    hasType(schema, 'Categorization') ||
    hasType(schema, 'Group')
  );
};

export const isKnownType = (schema: UISchemaElement): boolean => {
  return (
    hasType(schema, 'Control') ||
    isLayoutType(schema) ||
    hasType(schema, 'HelpContent') ||
    isListWithDetail(schema) ||
    hasType(schema, 'Callout')
  );
};

export const isListWithDetail = (schema: UISchemaElement): boolean => {
  return hasType(schema, 'ListWithDetail');
};

export const isScopedPrefixed = (scope: string): boolean => {
  return scope.startsWith('#');
};

export const isEmptyObject = (schema: object): boolean => {
  return Object.keys(schema).length === 0;
};

export const isControlWithNoScope = (uiSchema: UISchemaElement): boolean => {
  return 'type' in uiSchema && uiSchema.type === 'Control' && !('scope' in uiSchema);
};

export const isCategorization = (uiSchema: UISchemaElement): boolean => {
  return uiSchema.type === 'Categorization';
};

export const hasElements = (schema: object): boolean => {
  return 'elements' in schema && Array.isArray(schema.elements);
};

export const isEmptyElements = (schema: object): boolean => {
  return (
    'elements' in schema &&
    schema.elements !== undefined &&
    schema.elements !== null &&
    Object.keys(schema.elements).length === 0
  );
};

export const hasVariant = (schema: UISchemaElement): boolean => {
  return 'options' in schema && schema.options !== undefined && schema.options !== null;
};
