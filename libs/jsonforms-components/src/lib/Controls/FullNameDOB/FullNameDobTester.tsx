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

const isFullNameDoBSchema = (obj: unknown): boolean => {
  if (isObject(obj)) {
    const keys = Object.keys(obj);
    return (
      ['firstName', 'middleName', 'lastName', 'dateOfBirth'].every((attr) => keys.includes(attr)) && keys.length === 4
    );
  }

  return false;
};

export const isFullNameDoB = (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
  if (!isControl(uischema) || !isScoped(uischema)) {
    return false;
  }

  if (schema?.properties && isObject(schema?.properties)) {
    const propertyFromScope = uischema['scope'].split('/').pop() as string;
    if (isObject(schema.properties[propertyFromScope]) && 'properties' in schema.properties[propertyFromScope]) {
      const objToTest = schema.properties[propertyFromScope]['properties'];

      if (objToTest && isFullNameDoBSchema(objToTest)) {
        return true;
      }
    }
  }

  return false;
};

export const FullNameDobTester: RankedTester = rankWith(4, isFullNameDoB);
