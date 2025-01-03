import { JsonSchema, Tester, RankedTester, rankWith, schemaMatches } from '@jsonforms/core';
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
  return schemaMatches((schema: JsonSchema) => {
    return schema && isPropertiesMatch(schema.properties, props, isExactMatch);
  });
};

export const createSchemaMatchRankedTester = (props: string[], isExactMatch = false): RankedTester => {
  const schemaMatchTester = createSchemaMatchTester(props, isExactMatch);
  return rankWith(SCHEMA_MATCH_TESTER_SCORE, schemaMatchTester);
};
