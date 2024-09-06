import type { $RefParser } from '@apidevtools/json-schema-ref-parser';
import { JsonSchema, JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import _ from 'lodash';

let dereference: $RefParser['dereference'];
export async function resolveRefs(schema: JsonSchema, ...refSchemas: JsonSchema[]): Promise<JsonSchema> {
  if (!dereference) {
    dereference = (await import('@apidevtools/json-schema-ref-parser'))?.dereference;

    if (!dereference) {
      throw new Error('@apidevtools/json-schema-ref-parser is required for use of resolveRefs().');
    }
  }

  const available = refSchemas.reduce((schemas, refSchema) => {
    const id = (refSchema as JsonSchema7).$id || (refSchema as JsonSchema4).id;
    if (id) {
      schemas[id] = refSchema;
    }
    return schemas;
  }, {} as Record<string, JsonSchema>);

  // Clone since dereference will in place modify the input schema.
  const source = _.cloneDeep(schema);
  const result = await dereference(source, {
    continueOnError: false,
    resolve: {
      http: false,
      file: false,
      static: {
        order: 1,
        canRead: /^https?:/,
        read: function ({ url }: { url: string }) {
          const resolved = available[url];
          if (!resolved) {
            throw new Error(`Failed to resolve schema for: ${url}`);
          }

          return resolved;
        },
      },
    },
  });

  return result as JsonSchema;
}

export async function tryResolveRefs(schema: JsonSchema, ...refSchemas: JsonSchema[]): Promise<[JsonSchema, unknown?]> {
  try {
    const result = await resolveRefs(schema, ...refSchemas);
    return [result as JsonSchema];
  } catch (err) {
    return [schema, err];
  }
}
