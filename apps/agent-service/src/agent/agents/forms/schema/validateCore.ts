import Ajv from 'ajv';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { collectControlScopes, countCategories, countControlElements, countProperties } from './counts';

export interface SchemaValidationError {
  path: string;
  message: string;
}

export interface SchemaValidationCounts {
  propertyCount: number;
  categoryCount: number;
  controlCount: number;
}

export interface SchemaValidationResult {
  ok: boolean;
  errors: SchemaValidationError[];
  counts: SchemaValidationCounts;
}

interface ShowHideTarget {
  effect: string;
  scopes: string[];
  triggerScope?: string;
}

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(standardV1JsonSchema);
ajv.addSchema(commonV1JsonSchema);

export function validateFormSchemas(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  errors.push(...validateDataSchema(dataSchema));
  errors.push(...validateScopesResolve(dataSchema, uiSchema));
  errors.push(...validateConditionalRequired(dataSchema, uiSchema));

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      propertyCount: countProperties(dataSchema),
      categoryCount: countCategories(uiSchema),
      controlCount: countControlElements(uiSchema),
    },
  };
}

function validateDataSchema(dataSchema: Record<string, unknown>): SchemaValidationError[] {
  try {
    ajv.compile(dataSchema);
    return [];
  } catch (err) {
    return [{ path: '/', message: err instanceof Error ? err.message : String(err) }];
  }
}

function validateScopesResolve(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  const controlScopes = collectControlScopes(uiSchema);
  for (const scope of controlScopes) {
    if (!pointerExists(dataSchema, scope)) {
      errors.push({ path: scope, message: `Control scope does not resolve in dataSchema: ${scope}` });
    }
  }

  for (const target of collectShowHideTargets(uiSchema)) {
    if (target.triggerScope && !pointerExists(dataSchema, target.triggerScope)) {
      errors.push({
        path: target.triggerScope,
        message: `Rule condition scope does not resolve in dataSchema: ${target.triggerScope}`,
      });
    }
  }

  return errors;
}

function validateConditionalRequired(
  dataSchema: Record<string, unknown>,
  uiSchema: Record<string, unknown>,
): SchemaValidationError[] {
  const topLevelRequired = new Set(Array.isArray(dataSchema.required) ? (dataSchema.required as string[]) : []);
  const thenRequired = collectThenRequired(dataSchema);
  const errors: SchemaValidationError[] = [];

  for (const target of collectShowHideTargets(uiSchema)) {
    if (target.effect !== 'SHOW' && target.effect !== 'HIDE') {
      continue;
    }
    for (const scope of target.scopes) {
      const propertyName = scopeToTopLevelProperty(scope);
      if (!propertyName || !topLevelRequired.has(propertyName)) {
        continue;
      }
      if (!thenRequired.has(propertyName)) {
        errors.push({
          path: scope,
          message: `SHOW/HIDE target '${propertyName}' is in top-level required without a matching if/then required block.`,
        });
      }
    }
  }

  return errors;
}

function collectThenRequired(dataSchema: Record<string, unknown>): Set<string> {
  const required = new Set<string>();
  addThenRequired(dataSchema.then as Record<string, unknown> | undefined, required);
  if (Array.isArray(dataSchema.allOf)) {
    for (const block of dataSchema.allOf as Record<string, unknown>[]) {
      addThenRequired(block.then as Record<string, unknown> | undefined, required);
    }
  }
  return required;
}

function addThenRequired(thenBlock: Record<string, unknown> | undefined, required: Set<string>): void {
  if (!thenBlock || !Array.isArray(thenBlock.required)) {
    return;
  }
  for (const name of thenBlock.required as string[]) {
    required.add(name);
  }
}

function collectShowHideTargets(node: unknown, results: ShowHideTarget[] = []): ShowHideTarget[] {
  if (!node || typeof node !== 'object') {
    return results;
  }

  const record = node as Record<string, unknown>;
  const rule = record.rule as Record<string, unknown> | undefined;
  if (rule) {
    const condition = rule.condition as Record<string, unknown> | undefined;
    results.push({
      effect: rule.effect as string,
      scopes: collectControlScopes(record),
      triggerScope: typeof condition?.scope === 'string' ? condition.scope : undefined,
    });
  }

  if (Array.isArray(record.elements)) {
    for (const child of record.elements) {
      collectShowHideTargets(child, results);
    }
  }

  return results;
}

function pointerExists(dataSchema: Record<string, unknown>, scope: string): boolean {
  if (!scope?.startsWith('#/')) {
    return false;
  }

  let node: unknown = dataSchema;
  for (const part of scope.slice(2).split('/').map(decodePointerToken)) {
    if (!node || typeof node !== 'object' || !(part in (node as Record<string, unknown>))) {
      return false;
    }
    node = (node as Record<string, unknown>)[part];
  }

  return node !== undefined;
}

function decodePointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function scopeToTopLevelProperty(scope: string): string | null {
  const match = scope?.match(/^#\/properties\/([^/]+)$/);
  return match ? match[1] : null;
}
