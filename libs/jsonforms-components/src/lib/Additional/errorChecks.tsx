import { JsonSchema, UISchemaElement } from '@jsonforms/core';

export const isNullSchema = (schema: UISchemaElement): boolean => {
  return schema === undefined || schema === null;
};

export const isValidScope = (uiSchema: UISchemaElement, schema: JsonSchema): boolean => {
  if (!('scope' in uiSchema)) {
    return false;
  }
  const scopeComponents = (uiSchema.scope as string).split('/');
  // get rid of the '#' at the beginning of scope
  scopeComponents.shift();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj = schema as any;
  // iterate through the schema to ensure each property exists
  for (const key of scopeComponents) {
    if (obj && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return false;
    }
  }
  return true;
};

export const isLayoutType = (type: string): boolean => {
  return type === 'VerticalLayout' || type === 'HorizontalLayout' || type === 'Categorization' || type === 'Group';
};

export const isScopedPrefixed = (scope: string): boolean => {
  const scopeComponents = scope.split('/');
  return scopeComponents.length > 1 && scopeComponents[0] === '#';
};

export const isEmptyObject = (schema: any): boolean => {
  return Object.keys(schema).length === 0;
};

export const isControlWithNoScope = (uiSchema: UISchemaElement): boolean => {
  return 'type' in uiSchema && uiSchema.type === 'Control' && !('scope' in uiSchema);
};

export const isCategorization = (uiSchema: UISchemaElement): boolean => {
  return uiSchema.type === 'Categorization';
};

export const hasElements = (schema: object): boolean => {
  return 'elements' in schema;
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
  return 'options' in schema && schema.options !== undefined && schema.options !== null && 'variant' in schema.options;
};

export const isMissingProperties = (schema: JsonSchema): boolean => {
  return 'type' in schema && schema.type === 'object' && !('properties' in schema);
};
