import {
  rankWith,
  RankedTester,
  UISchemaElement,
  JsonSchema,
  TesterContext,
  isScoped,
  isControl,
} from '@jsonforms/core';

import { isObject } from 'lodash';

const isFullNameSchema = (obj: unknown): boolean => {
  if (isObject(obj)) {
    const keys = Object.keys(obj);
    return ['firstName', 'middleName', 'lastName'].every((attr) => keys.includes(attr)) && keys.length === 3;
  }

  return false;
};

export const isFullName = (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
  if (!isControl(uischema) || !isScoped(uischema)) {
    return false;
  }

  if (schema?.properties && isObject(schema?.properties)) {
    const propertyFromScope = uischema['scope'].split('/').pop() as string;
    if (isObject(schema.properties[propertyFromScope]) && 'properties' in schema.properties[propertyFromScope]) {
      const objToTest = schema.properties[propertyFromScope]['properties'];

      if (objToTest && isFullNameSchema(objToTest)) {
        return true;
      }
    }
  }

  return false;
};

export const FullNameTester: RankedTester = rankWith(4, isFullName);
