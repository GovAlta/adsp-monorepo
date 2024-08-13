import { JsonSchema } from '@jsonforms/core';
import { ajv } from '@lib/validation/checkInput';
import _ from 'lodash';

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

export const getDataRegisters = (obj, property) => {
  let registers = [];
  Object.keys(obj).forEach(function (key) {
    if (key === 'register' && property in obj[key]) {
      if (!registers.includes(obj[key]?.[property])) {
        registers.push(obj[key]?.[property]);
      }
    } else if (_.isObject(obj[key])) {
      registers = [...registers, ...getDataRegisters(obj[key], property)];
    } else if (_.isArray(obj[key])) {
      const nextRegisters = obj[key].map(function (arrayObj) {
        return getDataRegisters(arrayObj, property);
      });
      registers = [...registers, ...nextRegisters];
    }
  });
  return registers;
};
