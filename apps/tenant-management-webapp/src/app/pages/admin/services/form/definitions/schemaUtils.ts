import { JsonSchema } from '@jsonforms/core';
import { ajv } from '@lib/validation/checkInput';

export const propertiesErr = 'Data schema must have "properties"';
const hasProperties = (schema: JsonSchema): boolean => {
  return (
    (typeof schema === 'object' && Object.keys(schema).length === 0) ||
    ('properties' in schema && (('type' in schema && schema.type === 'object') || !('type' in schema)))
  );
};

export interface ParserResult<T> {
  get: () => T;
  hasError: () => boolean;
  error: () => string;
}

export const parseUiSchema = <T>(schema: string): ParserResult<T> => {
  let parsedSchema: T = {} as T;
  let err = null;
  try {
    parsedSchema = JSON.parse(schema);
  } catch (e) {
    err = e.message;
  }
  return {
    get: () => {
      return parsedSchema;
    },
    hasError: () => {
      return err != null;
    },
    error: () => {
      return err;
    },
  };
};

export const parseDataSchema = <T>(schema: string): ParserResult<T> => {
  let parsedSchema: T = {} as T;
  let err = null;
  try {
    parsedSchema = JSON.parse(schema);
    if (Object.keys(parsedSchema).length > 0) {
      ajv.compile(parsedSchema as object);
      if (!hasProperties(parsedSchema)) {
        err = propertiesErr;
      }
    }
  } catch (e) {
    err = e.message;
    parsedSchema = {} as T;
  }
  return {
    get: () => {
      return parsedSchema;
    },
    hasError: () => {
      return err != null;
    },
    error: () => {
      return err;
    },
  };
};

export const hasSchemaErrors = (schema: Record<string, unknown>): boolean => {
  if (schema && Object.keys(schema).length > 0) {
    const parsedSchema = parseUiSchema(JSON.stringify(schema));
    return Object.keys(parsedSchema).length < 1;
  }
  return false;
};

export const getValidSchemaString = (schema: Record<string, unknown>): string => {
  if (schema && Object.keys(schema).length > 0) {
    const parsedSchema = parseUiSchema(JSON.stringify(schema));
    return JSON.stringify(parsedSchema);
  }
  // ignore any errors and return an empty object.  Often the error is just because
  // the developer is in the middle of typing out something in the form editor.
  return '{}';
};
