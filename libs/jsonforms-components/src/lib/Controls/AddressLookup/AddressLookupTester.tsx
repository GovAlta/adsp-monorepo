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

const isAddressSchema = (obj: unknown): boolean => {
  if (isObject(obj)) {
    const keys = Object.keys(obj);
    return ['addressLine2', 'municipality', 'addressLine1', 'subdivisionCode', 'postalCode'].every((attr) =>
      keys.includes(attr)
    );
  }

  return false;
};

export const isAddressLookup = (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
  if (!isControl(uischema) || !isScoped(uischema)) {
    return false;
  }

  if (schema?.properties && isObject(schema?.properties)) {
    const propertyFromScope = uischema['scope'].split('/').pop() as string;
    if (isObject(schema.properties[propertyFromScope]) && 'properties' in schema.properties[propertyFromScope]) {
      const objToTest = schema.properties[propertyFromScope]['properties'];

      if (objToTest && isAddressSchema(objToTest)) {
        return true;
      }
    }
  }

  return false;
};

export const AddressLookUpTester: RankedTester = rankWith(3, isAddressLookup);
