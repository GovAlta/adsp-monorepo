import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createTool } from '@mastra/core/tools';
import * as z from 'zod';

type JsonSchema = Record<string, unknown>;

function collectRefs(value: unknown, refs: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRefs(item, refs));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && typeof child === 'string') {
        const local = child.match(/#\/definitions\/([^/]+)$/);
        if (local) {
          refs.add(local[1]);
        }
      } else {
        collectRefs(child, refs);
      }
    }
  }
}

/**
 * The named definitions of a schema, with the definitions they reference so the result is self-contained. The whole
 * common schema is about 1.8k tokens, and a question usually needs one or two of its definitions.
 */
export function selectDefinitions(schema: JsonSchema, names: string[]): JsonSchema {
  const definitions = (schema?.definitions ?? {}) as Record<string, unknown>;
  const selected: Record<string, unknown> = {};
  const pending = [...names];
  while (pending.length) {
    const name = pending.shift();
    if (!name || selected[name] || !definitions[name]) {
      continue;
    }
    selected[name] = definitions[name];
    const refs = new Set<string>();
    collectRefs(definitions[name], refs);
    pending.push(...refs);
  }

  const missing = names.filter((name) => !definitions[name]);
  return {
    $id: schema?.$id,
    definitions: selected,
    ...(missing.length ? { missing, available: Object.keys(definitions) } : {}),
  };
}

export async function createSchemaTools() {
  const schemas: Record<string, JsonSchema> = {
    [standardV1JsonSchema.$id]: standardV1JsonSchema,
    [commonV1JsonSchema.$id]: commonV1JsonSchema,
  };
  const schemaDefinitionTool = createTool({
    id: 'get-schema-definition',
    description: `Get the JSON schema definitions for common fields like email, full name, and address. Pass definitions
with the names you need (for example ["postalAddressAlberta"]) to get only those and the definitions they use.`,
    inputSchema: z.object({
      url: z
        .string()
        .describe('URL of the schema definition file, such as https://adsp.alberta.ca/common.v1.schema.json.'),
      definitions: z
        .array(z.string())
        .optional()
        .describe('Names of the definitions to return. Leave out to get the whole schema file.'),
    }),
    outputSchema: z.object({
      jsonSchema: z.object({}).passthrough(),
    }),
    execute: async ({ url, definitions }) => {
      const [file, fragment] = url.split('#');
      const schema = schemas[file] ?? schemas[url];
      const fromFragment = fragment?.match(/^\/definitions\/([^/]+)$/)?.[1];
      const names = [...(definitions ?? []), ...(fromFragment ? [fromFragment] : [])];
      return { jsonSchema: schema && names.length ? selectDefinitions(schema, names) : schema };
    },
  });
  return { schemaDefinitionTool };
}

export type SchemaDefinitionTool = Awaited<ReturnType<typeof createSchemaTools>>['schemaDefinitionTool'];
