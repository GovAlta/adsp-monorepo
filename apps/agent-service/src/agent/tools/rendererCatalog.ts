import * as fs from 'fs';
import * as path from 'path';
import { createTool } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';

interface RendererCatalogToolsProps {
  logger: Logger;
}

const rendererDefinitionSchema = z.object({
  id: z.string(),
  tester: z.string(),
  kind: z.string(),
  ui: z
    .object({
      type: z.string(),
      options: z
        .object({
          required: z.record(z.string(), z.unknown()).default({}),
          optional: z.record(z.string(), z.unknown()).default({}),
        })
        .default({ required: {}, optional: {} }),
    })
    .default({ type: 'Control', options: { required: {}, optional: {} } }),
  match: z.object({
    scope: z.string().default('control'),
    schema: z
      .object({
        type: z.string().nullable().default(null),
        format: z.string().nullable().default(null),
        enum: z.boolean().nullable().default(null),
        requiredProperties: z.array(z.string()).default([]),
        exactProperties: z.boolean().nullable().default(null),
        arrayItemType: z.string().nullable().default(null),
      })
      .default({
        type: null,
        format: null,
        enum: null,
        requiredProperties: [],
        exactProperties: null,
        arrayItemType: null,
      }),
  }),
  rank: z.number().default(0),
  supports: z
    .object({
      input: z.boolean().default(false),
      review: z.boolean().default(false),
    })
    .default({ input: false, review: false }),
  fallback: z
    .object({
      strategy: z.string(),
      message: z.string(),
    })
    .default({ strategy: 'unsupported', message: 'No compatible renderer found.' }),
  source: z
    .object({
      file: z.string().nullable().default(null),
    })
    .default({ file: null }),
  notes: z.array(z.string()).default([]),
  internal: z.boolean().optional().default(false),
});

const rendererCatalogSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  sourceCommit: z.string(),
  sourcePath: z.string(),
  rendererCount: z.number(),
  renderers: z.array(rendererDefinitionSchema),
});

const rendererCatalogInputSchema = z.object({
  schema: z.record(z.string(), z.unknown()).describe('JSON schema for the field or object to evaluate.'),
  ui: z
    .object({
      type: z.string().optional().describe('Optional JSONForms UI schema type hint, e.g., Control or Categorization.'),
      options: z.record(z.string(), z.unknown()).optional().describe('Optional UI schema options to validate.'),
    })
    .optional(),
  mode: z.enum(['input', 'review']).default('input').describe('Whether to check input renderers or review renderers.'),
});

const rendererCatalogOutputSchema = z.object({
  supported: z.boolean(),
  mode: z.enum(['input', 'review']),
  matches: z.array(
    z.object({
      id: z.string(),
      tester: z.string(),
      kind: z.string(),
      rank: z.number(),
      uiType: z.string(),
      supports: z.object({
        input: z.boolean(),
        review: z.boolean(),
      }),
      constraints: z.object({
        schemaType: z.string().nullable(),
        format: z.string().nullable(),
        enum: z.boolean().nullable(),
        requiredProperties: z.array(z.string()),
        exactProperties: z.boolean().nullable(),
        arrayItemType: z.string().nullable(),
        requiredOptions: z.record(z.string(), z.unknown()),
      }),
      reason: z.string(),
    })
  ),
  guidance: z.object({
    strategy: z.string(),
    message: z.string(),
  }),
});

type RendererCatalog = z.infer<typeof rendererCatalogSchema>;

let cachedCatalog: RendererCatalog | null = null;

export async function createRendererCatalogTools({ logger }: RendererCatalogToolsProps) {
  const rendererCatalogTool = createTool({
    id: 'get-renderer-catalog-match',
    description:
      'Checks whether a schema/ui combination has a matching JSONForms renderer and returns fallback guidance when unsupported.',
    inputSchema: rendererCatalogInputSchema,
    outputSchema: rendererCatalogOutputSchema,
    execute: async (inputData) => {
      const catalog = loadCatalog(logger);
      const { schema, ui, mode } = inputData;

      const matches = catalog.renderers
        .filter((renderer) => renderer.supports[mode])
        .filter((renderer) => !renderer.internal) // Exclude internal/error renderers
        .map((renderer) => {
          const evaluation = evaluateRenderer(renderer, schema, ui?.type, ui?.options ?? {});
          return {
            renderer,
            ...evaluation,
          };
        })
        .filter((result) => result.matches)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ renderer, reason }) => ({
          id: renderer.id,
          tester: renderer.tester,
          kind: renderer.kind,
          rank: renderer.rank,
          uiType: renderer.ui.type,
          supports: renderer.supports,
          constraints: {
            schemaType: renderer.match.schema.type,
            format: renderer.match.schema.format,
            enum: renderer.match.schema.enum,
            requiredProperties: renderer.match.schema.requiredProperties,
            exactProperties: renderer.match.schema.exactProperties,
            arrayItemType: renderer.match.schema.arrayItemType,
            requiredOptions: renderer.ui.options.required,
          },
          reason,
        }));

      const supported = matches.length > 0;

      const guidance = supported
        ? { strategy: 'supported', message: 'Matching renderer(s) found. Use one of the returned matches.' }
        : defaultGuidance(schema);

      logger.info('Renderer catalog lookup completed.', {
        context: 'rendererCatalogTool',
        supported,
        mode,
        matchCount: matches.length,
      });

      return {
        supported,
        mode,
        matches,
        guidance,
      };
    },
  });

  return { rendererCatalogTool };
}

export type RendererCatalogTool = Awaited<ReturnType<typeof createRendererCatalogTools>>['rendererCatalogTool'];

function loadCatalog(logger: Logger): RendererCatalog {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  // Catalog is copied into agent-service output during build
  const catalogPath = path.resolve(process.cwd(), 'dist/apps/agent-service/renderer-catalog.json');

  if (!fs.existsSync(catalogPath)) {
    throw new Error(
      'Renderer catalog file not found. Expected: dist/apps/agent-service/renderer-catalog.json'
    );
  }

  const raw = fs.readFileSync(catalogPath, 'utf8');
  const parsed = rendererCatalogSchema.parse(JSON.parse(raw));

  logger.info('Renderer catalog loaded.', {
    context: 'rendererCatalogTool',
    catalogPath,
    rendererCount: parsed.rendererCount,
    schemaVersion: parsed.schemaVersion,
  });

  cachedCatalog = parsed;
  return parsed;
}

function evaluateRenderer(
  renderer: RendererCatalog['renderers'][number],
  schema: Record<string, unknown>,
  uiType?: string,
  uiOptions: Record<string, unknown> = {}
): { matches: boolean; reason: string; score: number } {
  const mismatchReasons: string[] = [];

  if (uiType && renderer.ui.type !== uiType) {
    mismatchReasons.push(`ui.type '${uiType}' does not match renderer ui.type '${renderer.ui.type}'`);
  }

  const schemaType = typeof schema.type === 'string' ? schema.type : null;
  const schemaFormat = typeof schema.format === 'string' ? schema.format : null;
  const hasEnum = Array.isArray(schema.enum);

  if (renderer.match.schema.type !== null && renderer.match.schema.type !== schemaType) {
    mismatchReasons.push(`schema.type '${schemaType}' does not satisfy '${renderer.match.schema.type}'`);
  }

  if (renderer.match.schema.format !== null && renderer.match.schema.format !== schemaFormat) {
    mismatchReasons.push(`schema.format '${schemaFormat}' does not satisfy '${renderer.match.schema.format}'`);
  }

  if (renderer.match.schema.enum !== null && renderer.match.schema.enum !== hasEnum) {
    mismatchReasons.push(`schema.enum presence '${hasEnum}' does not satisfy '${renderer.match.schema.enum}'`);
  }

  const schemaProperties = isRecord(schema.properties) ? Object.keys(schema.properties) : [];

  if (renderer.match.schema.requiredProperties.length > 0) {
    const missing = renderer.match.schema.requiredProperties.filter((property) => !schemaProperties.includes(property));
    if (missing.length > 0) {
      mismatchReasons.push(`missing required properties: ${missing.join(', ')}`);
    }
  }

  if (renderer.match.schema.exactProperties === true) {
    const expected = renderer.match.schema.requiredProperties;
    if (schemaProperties.length !== expected.length || expected.some((property) => !schemaProperties.includes(property))) {
      mismatchReasons.push('schema.properties does not exactly match requiredProperties');
    }
  }

  if (renderer.match.schema.arrayItemType) {
    const itemType = getArrayItemType(schema);
    if (itemType !== renderer.match.schema.arrayItemType) {
      mismatchReasons.push(`array item type '${itemType ?? 'unknown'}' does not satisfy '${renderer.match.schema.arrayItemType}'`);
    }
  }

  const requiredOptions = renderer.ui.options.required;
  for (const [key, expectedValue] of Object.entries(requiredOptions)) {
    if (!isDeepEqual(uiOptions[key], expectedValue)) {
      mismatchReasons.push(`ui.options.${key} does not match required value`);
    }
  }

  if (mismatchReasons.length > 0) {
    return {
      matches: false,
      reason: mismatchReasons.join('; '),
      score: -1,
    };
  }

  const score = renderer.rank * 100 + renderer.match.schema.requiredProperties.length;
  return {
    matches: true,
    reason: 'All renderer constraints satisfied.',
    score,
  };
}

function defaultGuidance(schema: Record<string, unknown>): { strategy: string; message: string } {
  const schemaType = typeof schema.type === 'string' ? schema.type : null;

  if (schemaType === 'object') {
    return {
      strategy: 'decompose-object',
      message:
        'No direct renderer match for this object shape. Decompose into primitive child properties or use a known common schema reference (e.g., fullName/address/phone).',
    };
  }

  return {
    strategy: 'unsupported',
    message: 'No compatible renderer found for the provided schema/ui combination. Adjust schema format/options or use a supported UI type.',
  };
}

function getArrayItemType(schema: Record<string, unknown>): string | null {
  if (schema.type !== 'array' || !isRecord(schema.items)) {
    return null;
  }

  const itemType = schema.items.type;
  if (itemType === 'object') {
    return 'object';
  }

  if (typeof itemType === 'string') {
    return 'primitive';
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDeepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
