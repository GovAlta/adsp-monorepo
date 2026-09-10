import { cloneJson, collectControlScopes, countControlElements } from '../../schema/counts';
import type { IncrementFailedArtifact } from './limits';

export type IncrementType = 'scaffold' | 'category' | 'branch';

export interface ConditionalRequiredInput {
  conditionScope: string;
  conditionValue: unknown;
  required: string[];
}

export interface BranchInput {
  label: string;
  triggerScope: string;
  triggerValue: unknown;
  effect?: 'SHOW' | 'HIDE' | 'ENABLE' | 'DISABLE';
}

export interface IncrementMergeInput {
  incrementType: IncrementType;
  categoryLabel?: string;
  categoryLabels?: string[];
  /** Planned category labels in order, used to place a category created on demand. */
  categoryOrder?: string[];
  variant?: 'pages' | 'stepper';
  dataSchemaProperties?: Record<string, unknown>;
  required?: string[];
  uiElements?: Record<string, unknown>[];
  conditionalRequired?: ConditionalRequiredInput[];
  branch?: BranchInput;
}

export interface MergeSuccess {
  ok: true;
  dataSchema: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
}

export interface MergeFailure {
  ok: false;
  failedArtifact: IncrementFailedArtifact;
  message: string;
}

export type MergeResult = MergeSuccess | MergeFailure;

interface CategoryLookup {
  index: number;
  category: Record<string, unknown>;
}

function lookupCategory(uiSchema: Record<string, unknown>, categoryLabel?: string): CategoryLookup | null {
  if (uiSchema.type !== 'Categorization' || !Array.isArray(uiSchema.elements)) {
    return null;
  }

  const elements = uiSchema.elements as Record<string, unknown>[];
  if (typeof categoryLabel === 'string') {
    const index = elements.findIndex((element) => element.type === 'Category' && element.label === categoryLabel);
    if (index >= 0) {
      return { index, category: elements[index] };
    }
  }

  return null;
}

export function mergeIncrement(
  current: { dataSchema: Record<string, unknown>; uiSchema: Record<string, unknown> },
  input: IncrementMergeInput,
): MergeResult {
  const dataSchema = cloneJson(current.dataSchema);
  const uiSchema = cloneJson(current.uiSchema);

  switch (input.incrementType) {
    case 'scaffold':
      return applyScaffold(dataSchema, uiSchema, input);
    case 'category':
      return applyCategoryIncrement(dataSchema, uiSchema, input);
    case 'branch':
      return applyBranchIncrement(dataSchema, uiSchema, input);
    default:
      return { ok: false, failedArtifact: 'invalid_increment', message: 'Unknown incrementType.' };
  }
}

function applyScaffold(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
  input: IncrementMergeInput,
): MergeResult {
  const labels = input.categoryLabels ?? [];
  if (labels.length === 0) {
    return { ok: false, failedArtifact: 'invalid_increment', message: 'scaffold requires categoryLabels.' };
  }

  if (isNonEmptyNonCategorization(uiSchema)) {
    return {
      ok: false,
      failedArtifact: 'scaffold_rejected',
      message:
        'scaffold is rejected on a non-empty VerticalLayout. Only empty forms can be promoted to Categorization.',
    };
  }

  if (uiSchema.type !== 'Categorization') {
    uiSchema.type = 'Categorization';
    uiSchema.elements = [];
    uiSchema.options = { variant: input.variant ?? 'pages' };
  }

  // No empty Category shells: the preview renderer rejects a Categorization containing one,
  // so categories are created by their own increment and the preview grows with each save.
  return { ok: true, dataSchema, uiSchema };
}

function applyCategoryIncrement(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
  input: IncrementMergeInput,
): MergeResult {
  const merged = mergeDataAndConditionals(dataSchema, input);
  if (merged.ok === false) {
    return merged;
  }

  const target = resolveUiTarget(uiSchema, input, true);
  if (target.ok === false) {
    return target;
  }

  const duplicate = findDuplicateScope(target.elements, input.uiElements ?? []);
  if (duplicate) {
    return duplicate;
  }

  target.elements.push(...(input.uiElements ?? []));
  return { ok: true, dataSchema, uiSchema };
}

function applyBranchIncrement(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
  input: IncrementMergeInput,
): MergeResult {
  if (!input.branch) {
    return { ok: false, failedArtifact: 'invalid_increment', message: 'branch increment requires a branch object.' };
  }

  const incomingScopes = collectControlScopes({ type: 'VerticalLayout', elements: input.uiElements ?? [] });
  if (incomingScopes.includes(input.branch.triggerScope)) {
    return {
      ok: false,
      failedArtifact: 'branch_trigger_in_payload',
      message: 'branch uiElements must not include a Control whose scope is the triggerScope.',
    };
  }

  const merged = mergeDataAndConditionals(dataSchema, input);
  if (merged.ok === false) {
    return merged;
  }

  const target = resolveUiTarget(uiSchema, input, false);
  if (target.ok === false) {
    return target;
  }

  const duplicate = findDuplicateScope(target.elements, input.uiElements ?? []);
  if (duplicate) {
    return duplicate;
  }

  target.elements.push(createBranchWrapper(input.branch, input.uiElements ?? []));
  return { ok: true, dataSchema, uiSchema };
}

function mergeDataAndConditionals(
  dataSchema: Record<string, unknown>,
  input: IncrementMergeInput,
): MergeFailure | { ok: true } {
  const mergedProperties = mergeProperties(
    (dataSchema.properties ?? {}) as Record<string, Record<string, unknown>>,
    (input.dataSchemaProperties ?? {}) as Record<string, Record<string, unknown>>,
  );
  if (mergedProperties.ok === false) {
    return mergedProperties;
  }

  dataSchema.properties = mergedProperties.properties;
  dataSchema.required = unionRequired(dataSchema.required, input.required);
  applyConditionalRequired(dataSchema, input.conditionalRequired ?? []);
  return { ok: true };
}

interface UiTargetSuccess {
  ok: true;
  elements: Record<string, unknown>[];
}

function resolveUiTarget(
  uiSchema: Record<string, unknown>,
  input: IncrementMergeInput,
  appendCategoryIfMissing: boolean,
): UiTargetSuccess | MergeFailure {
  if (uiSchema.type !== 'Categorization') {
    if (!Array.isArray(uiSchema.elements)) {
      uiSchema.elements = [];
    }
    return { ok: true, elements: uiSchema.elements as Record<string, unknown>[] };
  }

  const found = lookupCategory(uiSchema, input.categoryLabel);
  if (found) {
    if (!Array.isArray(found.category.elements)) {
      found.category.elements = [];
    }
    return { ok: true, elements: found.category.elements as Record<string, unknown>[] };
  }

  if (!appendCategoryIfMissing || !input.categoryLabel) {
    return {
      ok: false,
      failedArtifact: 'invalid_increment',
      message: 'Could not find the target category for this increment.',
    };
  }

  const created: Record<string, unknown> = { type: 'Category', label: input.categoryLabel, elements: [] };
  insertCategory(uiSchema.elements as Record<string, unknown>[], created, input.categoryOrder);
  return { ok: true, elements: created.elements as Record<string, unknown>[] };
}

function insertCategory(
  elements: Record<string, unknown>[],
  category: Record<string, unknown>,
  order?: string[],
): void {
  const position = order ? order.indexOf(category.label as string) : -1;
  if (!order || position < 0) {
    elements.push(category);
    return;
  }

  const successor = elements.findIndex((element) => order.indexOf(element.label as string) > position);
  elements.splice(successor < 0 ? elements.length : successor, 0, category);
}

function findDuplicateScope(
  targetElements: Record<string, unknown>[],
  incoming: Record<string, unknown>[],
): MergeFailure | null {
  const existing = new Set(collectControlScopes({ type: 'VerticalLayout', elements: targetElements }));
  const incomingScopes = collectControlScopes({ type: 'VerticalLayout', elements: incoming });
  const duplicate = incomingScopes.find((scope) => existing.has(scope));
  if (!duplicate) {
    return null;
  }

  return {
    ok: false,
    failedArtifact: 'duplicate_scope',
    message: `Control scope ${duplicate} already exists in the target layout.`,
  };
}

function isNonEmptyNonCategorization(uiSchema: Record<string, unknown>): boolean {
  if (uiSchema.type === 'Categorization') {
    return false;
  }
  return Array.isArray(uiSchema.elements) && uiSchema.elements.length > 0;
}

function mergeProperties(
  existing: Record<string, Record<string, unknown>>,
  incoming: Record<string, Record<string, unknown>>,
): { ok: true; properties: Record<string, Record<string, unknown>> } | MergeFailure {
  const properties = { ...existing };
  for (const [key, incomingSchema] of Object.entries(incoming)) {
    const current = properties[key];
    if (!current) {
      properties[key] = cloneJson(incomingSchema);
      continue;
    }

    const merged = mergePropertySchema(current, incomingSchema, key);
    if (merged.ok === false) {
      return merged;
    }
    properties[key] = merged.schema;
  }

  return { ok: true, properties };
}

function mergePropertySchema(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  propertyName: string,
): { ok: true; schema: Record<string, unknown> } | MergeFailure {
  if (hasRefConflict(existing, incoming)) {
    return collision(propertyName, '$ref schemas cannot be overwritten or mixed with a different schema.');
  }
  if (existing.$ref || incoming.$ref) {
    return { ok: true, schema: existing };
  }
  if (fixedFieldChanged(existing, incoming)) {
    return collision(propertyName, 'type, enum, format, and pattern cannot be changed.');
  }

  if (existing.type === 'object' && incoming.type === 'object') {
    return mergeObjectSchemas(existing, incoming, propertyName);
  }

  return { ok: true, schema: existing };
}

function mergeObjectSchemas(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  propertyName: string,
): { ok: true; schema: Record<string, unknown> } | MergeFailure {
  const nested = mergeProperties(
    (existing.properties ?? {}) as Record<string, Record<string, unknown>>,
    (incoming.properties ?? {}) as Record<string, Record<string, unknown>>,
  );
  if (nested.ok === false) {
    return nested;
  }

  const schema = cloneJson(existing);
  schema.properties = nested.properties;
  schema.required = unionRequired(existing.required, incoming.required as string[] | undefined);
  return { ok: true, schema };
}

function hasRefConflict(existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
  if (!existing.$ref && !incoming.$ref) {
    return false;
  }
  return !(existing.$ref && incoming.$ref && existing.$ref === incoming.$ref);
}

function fixedFieldChanged(existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
  return ['type', 'enum', 'format', 'pattern'].some((field) => {
    if (existing[field] === undefined || incoming[field] === undefined) {
      return false;
    }
    return JSON.stringify(existing[field]) !== JSON.stringify(incoming[field]);
  });
}

function collision(propertyName: string, detail: string): MergeFailure {
  return {
    ok: false,
    failedArtifact: 'property_collision',
    message: `Property '${propertyName}' collision: ${detail}`,
  };
}

export function unionRequired(existing: unknown, incoming?: string[]): string[] {
  const current = Array.isArray(existing) ? (existing as string[]) : [];
  if (!incoming?.length) {
    return current;
  }
  return [...new Set([...current, ...incoming])];
}

export function promoteIfThen(dataSchema: Record<string, unknown>, block: Record<string, unknown>): void {
  if (dataSchema.if) {
    const existing: Record<string, unknown> = { if: dataSchema.if, then: dataSchema.then };
    if (dataSchema.else !== undefined) {
      existing.else = dataSchema.else;
    }
    delete dataSchema.if;
    delete dataSchema.then;
    delete dataSchema.else;
    const allOf = Array.isArray(dataSchema.allOf) ? (dataSchema.allOf as Record<string, unknown>[]) : [];
    dataSchema.allOf = [existing, ...allOf];
  }

  if (!Array.isArray(dataSchema.allOf)) {
    if (!dataSchema.if) {
      dataSchema.if = block.if;
      dataSchema.then = block.then;
      if (block.else !== undefined) {
        dataSchema.else = block.else;
      }
      return;
    }
    dataSchema.allOf = [];
  }

  (dataSchema.allOf as Record<string, unknown>[]).push(block);
}

function applyConditionalRequired(dataSchema: Record<string, unknown>, blocks: ConditionalRequiredInput[]): void {
  for (const block of blocks) {
    const propertyName = scopeToTopLevelProperty(block.conditionScope);
    if (!propertyName) {
      continue;
    }
    promoteIfThen(dataSchema, {
      if: {
        properties: { [propertyName]: { const: block.conditionValue } },
        required: [propertyName],
      },
      then: { required: block.required },
    });
  }
}

function createBranchWrapper(branch: BranchInput, uiElements: Record<string, unknown>[]): Record<string, unknown> {
  const schema = Array.isArray(branch.triggerValue) ? { enum: branch.triggerValue } : { const: branch.triggerValue };

  return {
    type: 'Group',
    label: branch.label,
    elements: uiElements,
    rule: {
      effect: branch.effect ?? 'SHOW',
      condition: {
        scope: branch.triggerScope,
        schema,
      },
    },
  };
}

function scopeToTopLevelProperty(scope: string): string | null {
  const match = scope?.match(/^#\/properties\/([^/]+)$/);
  return match ? match[1] : null;
}

export function incomingControlCount(uiElements: unknown[] | undefined): number {
  return (uiElements ?? []).reduce<number>((total, element) => total + countControlElements(element), 0);
}
