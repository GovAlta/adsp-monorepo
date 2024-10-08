import type { $RefParser } from '@apidevtools/json-schema-ref-parser';
import { JsonSchema, JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import _ from 'lodash';

function addSchemaWithHttpUrlId(schemas: Record<string, JsonSchema>, schema: JsonSchema) {
  const id = (schema as JsonSchema7).$id || (schema as JsonSchema4).id;
  if (id && /^https?:\/\//.test(id)) {
    schemas[id] = schema;
  }

  return schemas;
}

let dereference: $RefParser['dereference'];
export async function resolveRefs(schema: JsonSchema, ...refSchemas: JsonSchema[]): Promise<JsonSchema> {
  if (!dereference) {
    dereference = (await import('@apidevtools/json-schema-ref-parser'))?.dereference;

    if (!dereference) {
      throw new Error('@apidevtools/json-schema-ref-parser is required for use of resolveRefs().');
    }
  }

  const available = refSchemas.reduce(addSchemaWithHttpUrlId, {} as Record<string, JsonSchema>);

  const result = await dereference(schema, {
    continueOnError: false,
    mutateInputSchema: false,
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
