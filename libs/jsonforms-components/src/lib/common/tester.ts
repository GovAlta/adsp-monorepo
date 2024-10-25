import {
  UISchemaElement,
  JsonSchema,
  TesterContext,
  isScoped,
  isControl,
  Tester,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { isObject } from 'lodash';

const SCHEMA_MATCH_TESTER_SCORE = 4;

const isPropertiesMatch = (obj: unknown, props: string[], isExactMatch: boolean): boolean => {
  if (isObject(obj)) {
    const keys = Object.keys(obj);

    if (isExactMatch) {
      return props.every((attr) => keys.includes(attr)) && keys.length === props.length;
    } else {
      return props.every((attr) => keys.includes(attr));
    }
  }

  return false;
};

export const createSchemaMatchTester = (props: string[], isExactMatch = false): Tester => {
  return (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext) => {
    if (!isControl(uischema) || !isScoped(uischema)) {
      return false;
    }

    if (schema?.properties && isObject(schema?.properties)) {
      const propertyFromScope = uischema['scope'].split('/').pop() as string;
      if (isObject(schema.properties[propertyFromScope]) && 'properties' in schema.properties[propertyFromScope]) {
        const objToTest = schema.properties[propertyFromScope]['properties'];

        if (objToTest && isPropertiesMatch(objToTest, props, isExactMatch)) {
          return true;
        }
      }
    }

    return false;
  };
};

export const createSchemaMatchRankedTester = (props: string[], isExactMatch = false): RankedTester => {
  const schemaMatchTester = createSchemaMatchTester(props, isExactMatch);
  return rankWith(SCHEMA_MATCH_TESTER_SCORE, schemaMatchTester);
};
