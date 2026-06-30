import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import axios from 'axios';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

interface SchemaIndexToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

// ---- Types ----------------------------------------------------------------

interface ControlEntry {
  scope: string;
  uiPointer: string;
  label?: string;
}

interface HelpContentEntry {
  uiPointer: string;
  contentPath: string; // JSON Pointer to options.help — use this in formSchemaPatch to replace text
  label?: string;
}

interface CategoryEntry {
  categoryIndex: number;
  label: string;
  sectionTitle?: string;
  uiPointer: string;
  controls: ControlEntry[];
  helpContents: HelpContentEntry[];
}

interface DataPropertyEntry {
  dataPointer: string;
  type: string;
  required: boolean;
  categoryIndex: number;
  uiPointer?: string;
}

interface RuleEntry {
  effect: string;
  triggerScope: string;
  targetUiPointer: string;
}

interface ConditionalRequiredEntry {
  conditionScope: string;
  conditionValue: unknown;
  required: string[];
}

export interface SchemaIndex {
  rootType: string;
  categories: CategoryEntry[];
  dataProperties: Record<string, DataPropertyEntry>;
  topLevelRequired: string[];
  conditionalRequired: ConditionalRequiredEntry[];
  rules: RuleEntry[];
}

// ---- Index Builder --------------------------------------------------------

/**
 * Recursively finds all Control elements within a uiSchema node and records
 * their JSON Pointer paths relative to the uiSchema root.
 */
function collectControls(node: Record<string, unknown>, pointer: string, results: ControlEntry[]): void {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'Control' && typeof node.scope === 'string') {
    results.push({
      scope: node.scope,
      uiPointer: pointer,
      ...(typeof node.label === 'string' && { label: node.label }),
    });
    return;
  }

  if (Array.isArray(node.elements)) {
    (node.elements as Record<string, unknown>[]).forEach((el, i) => {
      collectControls(el, `${pointer}/elements/${i}`, results);
    });
  }
}

/**
 * Recursively finds all HelpContent elements with actual text content and records
 * their JSON Pointer paths so the agent can patch them directly.
 * Skips wrapper HelpContent elements (e.g. variant:"details") that have an empty options.help.
 */
function collectHelpContents(node: Record<string, unknown>, pointer: string, results: HelpContentEntry[]): void {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'HelpContent') {
    const options = node.options as Record<string, unknown> | undefined;
    const help = options?.help;
    const hasContent = Array.isArray(help) ? help.length > 0 : typeof help === 'string' && help !== '';
    if (hasContent) {
      results.push({
        uiPointer: pointer,
        contentPath: `${pointer}/options/help`,
        ...(typeof node.label === 'string' && node.label ? { label: node.label } : {}),
      });
    }
    // Always recurse — some HelpContent elements are wrappers (variant:"details") with children
    if (Array.isArray(node.elements)) {
      (node.elements as Record<string, unknown>[]).forEach((el, i) => {
        collectHelpContents(el, `${pointer}/elements/${i}`, results);
      });
    }
    return;
  }

  if (Array.isArray(node.elements)) {
    (node.elements as Record<string, unknown>[]).forEach((el, i) => {
      collectHelpContents(el, `${pointer}/elements/${i}`, results);
    });
  }
}

/**
 * Recursively finds all rule entries within a uiSchema node and records the
 * JSON Pointer of the element that carries the rule.
 */
function collectRules(node: Record<string, unknown>, pointer: string, results: RuleEntry[]): void {
  if (!node || typeof node !== 'object') return;

  const rule = node.rule as Record<string, unknown> | undefined;
  if (rule) {
    const condition = rule.condition as Record<string, unknown> | undefined;
    results.push({
      effect: rule.effect as string,
      triggerScope: condition?.scope as string,
      targetUiPointer: pointer,
    });
  }

  if (Array.isArray(node.elements)) {
    (node.elements as Record<string, unknown>[]).forEach((el, i) => {
      collectRules(el, `${pointer}/elements/${i}`, results);
    });
  }
}

/**
 * Extracts the top-level property name from a JSON Pointer scope string.
 * e.g. "#/properties/email" → "email"
 * Returns null for nested paths like "#/properties/name/properties/firstName".
 */
function scopeToPropertyName(scope: string): string | null {
  const match = scope?.match(/^#\/properties\/([^/]+)$/);
  return match ? match[1] : null;
}

/** Fills categoryIndex and uiPointer on each matched dataProperty entry. */
function crossReferenceControls(
  controls: ControlEntry[],
  dataProperties: Record<string, DataPropertyEntry>,
  categoryIndex: number,
): void {
  for (const ctrl of controls) {
    const propName = scopeToPropertyName(ctrl.scope);
    if (propName && dataProperties[propName]) {
      dataProperties[propName].categoryIndex = categoryIndex;
      dataProperties[propName].uiPointer = ctrl.uiPointer;
    }
  }
}

/** Pushes entries derived from a single if/then block into results. No-ops if the block is missing or malformed. */
function extractIfThenRequired(
  ifBlock: Record<string, unknown> | undefined,
  thenBlock: Record<string, unknown> | undefined,
  results: ConditionalRequiredEntry[],
): void {
  if (!ifBlock?.properties || !Array.isArray(thenBlock?.required)) return;
  const condProps = ifBlock.properties as Record<string, Record<string, unknown>>;
  for (const [prop, condition] of Object.entries(condProps)) {
    results.push({
      conditionScope: `#/properties/${prop}`,
      conditionValue: (condition as Record<string, unknown>).const,
      required: thenBlock.required as string[],
    });
  }
}

function extractConditionalRequired(dataSchema: Record<string, unknown>): ConditionalRequiredEntry[] {
  const results: ConditionalRequiredEntry[] = [];
  extractIfThenRequired(
    dataSchema.if as Record<string, unknown> | undefined,
    dataSchema.then as Record<string, unknown> | undefined,
    results,
  );
  if (Array.isArray(dataSchema.allOf)) {
    for (const block of dataSchema.allOf as Record<string, unknown>[]) {
      extractIfThenRequired(
        block.if as Record<string, unknown> | undefined,
        block.then as Record<string, unknown> | undefined,
        results,
      );
    }
  }
  return results;
}

function buildDataProperties(
  dataSchema: Record<string, unknown>,
  topLevelRequired: Set<string>,
): Record<string, DataPropertyEntry> {
  const properties = (dataSchema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const result: Record<string, DataPropertyEntry> = {};
  for (const [key, propSchema] of Object.entries(properties)) {
    result[key] = {
      dataPointer: `/properties/${key}`,
      type: propSchema.$ref ? '$ref' : ((propSchema.type as string) ?? 'unknown'),
      required: topLevelRequired.has(key),
      categoryIndex: -1,
    };
  }
  return result;
}

/**
 * Builds the schema index from raw dataSchema and uiSchema objects.
 * This is a pure, deterministic function — no LLM involvement.
 */
function buildSchemaIndex(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
): SchemaIndex {
  const topLevelRequiredSet = new Set<string>(
    Array.isArray(dataSchema.required) ? (dataSchema.required as string[]) : [],
  );
  const dataProperties = buildDataProperties(dataSchema, topLevelRequiredSet);
  const categories: CategoryEntry[] = [];
  const rules: RuleEntry[] = [];

  if (uiSchema.type === 'Categorization' && Array.isArray(uiSchema.elements)) {
    (uiSchema.elements as Record<string, unknown>[]).forEach((el, i) => {
      if (el.type !== 'Category') return;
      const categoryPointer = `/elements/${i}`;
      const controls: ControlEntry[] = [];
      const helpContents: HelpContentEntry[] = [];
      collectControls(el, categoryPointer, controls);
      collectHelpContents(el, categoryPointer, helpContents);
      collectRules(el, categoryPointer, rules);
      crossReferenceControls(controls, dataProperties, i);
      const options = el.options as Record<string, unknown> | undefined;
      categories.push({
        categoryIndex: i,
        label: (el.label as string) ?? '',
        ...(options?.sectionTitle && { sectionTitle: options.sectionTitle as string }),
        uiPointer: categoryPointer,
        controls,
        helpContents,
      });
    });
  } else {
    // Flat layout (VerticalLayout, etc.) — treat as a single virtual category
    const controls: ControlEntry[] = [];
    const helpContents: HelpContentEntry[] = [];
    collectControls(uiSchema, '', controls);
    collectHelpContents(uiSchema, '', helpContents);
    collectRules(uiSchema, '', rules);
    crossReferenceControls(controls, dataProperties, 0);
    if (controls.length > 0) {
      categories.push({ categoryIndex: 0, label: 'Form', uiPointer: '', controls, helpContents });
    }
  }

  return {
    rootType: (uiSchema.type as string) ?? 'VerticalLayout',
    categories,
    dataProperties,
    topLevelRequired: [...topLevelRequiredSet],
    conditionalRequired: extractConditionalRequired(dataSchema),
    rules,
  };
}

// ---- Tool -----------------------------------------------------------------

export async function createSchemaIndexTools({ directory, tokenProvider, logger }: SchemaIndexToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);

  const formSchemaIndex = createTool({
    id: 'get-form-schema-index',
    description: `Retrieve a lightweight structural index of the form's dataSchema and uiSchema.

Call this at the START of every conversation instead of formConfigurationRetrievalTool.
The index gives you:
- Every category (page) with its JSON Pointer into the uiSchema
- Every data property with its type, required status, and which category it belongs to
- JSON Pointers to every Control in the uiSchema
- JSON Pointers to every HelpContent element (contentPath points directly to options.help)
- All SHOW/HIDE/ENABLE/DISABLE rules with their trigger and target pointers
- Conditional required blocks (if/then)

Use the index to:
1. Identify which category contains the field or help block the user wants to change
2. Get the exact JSON Pointer (uiPointer / dataPointer / contentPath) for patch operations
3. Check whether a change has cross-category side effects (rules, conditionalRequired)

To update help text: use the helpContents[].contentPath from the index as the path in a
formSchemaPatch replace operation. No full schema read needed.

The index is always rebuilt fresh from the current schemas — it is never stale.`,
    inputSchema: z.object({}),
    outputSchema: z.object({
      rootType: z.string(),
      categories: z.array(
        z.object({
          categoryIndex: z.number(),
          label: z.string(),
          sectionTitle: z.string().optional(),
          uiPointer: z.string(),
          controls: z.array(
            z.object({
              scope: z.string(),
              uiPointer: z.string(),
              label: z.string().optional(),
            }),
          ),
          helpContents: z.array(
            z.object({
              uiPointer: z.string(),
              contentPath: z.string(),
              label: z.string().optional(),
            }),
          ),
        }),
      ),
      dataProperties: z.record(
        z.object({
          dataPointer: z.string(),
          type: z.string(),
          required: z.boolean(),
          categoryIndex: z.number(),
          uiPointer: z.string().optional(),
        }),
      ),
      topLevelRequired: z.array(z.string()),
      conditionalRequired: z.array(
        z.object({
          conditionScope: z.string(),
          conditionValue: z.unknown(),
          required: z.array(z.string()),
        }),
      ),
      rules: z.array(
        z.object({
          effect: z.string(),
          triggerScope: z.string(),
          targetUiPointer: z.string(),
        }),
      ),
    }),
    execute: async (_, context: ToolExecutionContext) => {
      const requestContext = context.requestContext as AdspRequestContext<{ formDefinitionId: string }>;
      const tenantId = requestContext.get('tenantId');
      const formDefinitionId = requestContext.get('formDefinitionId');

      const formDefinitionUrl = new URL(
        `v2/configuration/form-service/${formDefinitionId}/latest`,
        configurationServiceUrl,
      );

      const { data } = await axios.get(formDefinitionUrl.href, {
        params: { tenantId: tenantId?.toString() },
        headers: { Authorization: `Bearer ${await tokenProvider.getAccessToken()}` },
      });

      const index = buildSchemaIndex(
        (data.dataSchema ?? {}) as Record<string, unknown>,
        (data.uiSchema ?? {}) as Record<string, unknown>,
      );

      logger.info(
        `Schema index built for definition ${formDefinitionId}: ${index.categories.length} categories, ${Object.keys(index.dataProperties).length} properties.`,
        { context: 'formSchemaIndexGetTool', tenant: tenantId?.toString(), formDefinitionId },
      );

      return index;
    },
  });

  return { formSchemaIndex };
}

export type FormSchemaIndex = Awaited<
  ReturnType<typeof createSchemaIndexTools>
>['formSchemaIndex'];
