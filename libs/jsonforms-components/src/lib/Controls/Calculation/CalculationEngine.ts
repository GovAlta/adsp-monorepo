import { Parser } from 'expr-eval';
import { JsonSchema } from '@jsonforms/core';

export interface EvalResult {
  value?: number;
  error?: string;
}

/**
 * Escape for use in RegExp
 */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve a JSON Pointer–style scope like "#/properties/x" or "#/properties/arr/c3"
 */
export function resolveScope(scope: string, data: unknown): unknown {
  if (!scope || typeof scope !== 'string') return undefined;

  // normalize: strip "#/" and optional "properties/"
  const cleaned = scope.replace(/^#\/(properties\/)?/, '');
  const parts = cleaned.split('/').filter(Boolean);

  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/**
 * SUM(#/properties/arr/c3) helper
 */
export function evaluateSum(scope: string, data: unknown, opts?: { knownScopes?: string[] }): EvalResult {
  if (!scope || typeof scope !== 'string') {
    return { value: undefined, error: 'SUM requires a scope argument.' };
  }

  const normalized = scope.replace(/^#\/(properties\/)?/, '#/properties/');

  if (opts?.knownScopes && !opts.knownScopes.includes(normalized)) {
    return {
      value: undefined,
      error: `Invalid scope(s): ${normalized}`,
    };
  }

  const cleaned = scope.replace(/^#\/(properties\/)?/, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) {
    return {
      value: undefined,
      error: 'SUM requires array/column path like #/properties/arr/c3',
    };
  }

  const colKey = parts[parts.length - 1];
  const arrPath = parts.slice(0, -1);

  let cur: unknown = data;
  for (const p of arrPath) {
    if (cur == null || typeof cur !== 'object') {
      cur = undefined;
      break;
    }
    cur = (cur as Record<string, unknown>)[p];
  }

  if (cur === undefined) {
    return { value: undefined, error: undefined };
  }

  if (!Array.isArray(cur)) {
    return {
      value: undefined,
      error: `Expected an array at "#/properties/${arrPath.join('/')}"`,
    };
  }

  let sum = 0;
  let anyValue = false;
  let anyMissing = false;

  for (const row of cur) {
    if (row == null || typeof row !== 'object') continue;
    const v = (row as Record<string, unknown>)[colKey];
    if (typeof v === 'number' && Number.isFinite(v)) {
      anyValue = true;
      sum += v;
    } else if (v !== undefined && v !== null) {
      anyMissing = true;
    }
  }

  if (!anyValue && !anyMissing) {
    return { value: undefined, error: undefined };
  }

  if (anyMissing) {
    return {
      value: undefined,
      error: `Please provide values for: ${normalized}`,
    };
  }

  return { value: sum, error: undefined };
}

export function evaluateExpression(
  expression: string | undefined,
  data: unknown,
  opts?: { knownScopes?: string[] }
): EvalResult {
  if (!expression || typeof expression !== 'string') {
    return { value: undefined, error: undefined };
  }

  const trimmed = expression.trim();
  if (!trimmed) {
    return { value: undefined, error: undefined };
  }

  const sumMatch = trimmed.match(/^SUM\(\s*['"]?(.+?)['"]?\s*\)$/i);
  if (sumMatch) {
    const sumScope = sumMatch[1];
    return evaluateSum(sumScope, data, opts);
  }

  const scopeRegex = /#\/(?:properties\/)?[^\s"'()]+/g;
  const matches = trimmed.match(scopeRegex) || [];
  const uniqueScopes = Array.from(new Set(matches));

  const normalizedScopes = uniqueScopes.map((s) => s.replace(/^#\/(properties\/)?/, '#/properties/'));
  if (opts?.knownScopes && opts.knownScopes.length) {
    const invalidScopes = normalizedScopes.filter((s) => !opts.knownScopes!.includes(s));
    if (invalidScopes.length > 0) {
      return {
        value: undefined,
        error: `Invalid scope(s): ${invalidScopes.join(', ')}`,
      };
    }
  }

  const vars: Record<string, number> = {};
  let expr = trimmed;
  const missingScopes: string[] = [];
  let anyValuePresent = false;

  uniqueScopes.forEach((scope, idx) => {
    const normalized = scope.replace(/^#\/(properties\/)?/, '#/properties/');
    const val = resolveScope(scope, data);
    if (typeof val === 'number' && Number.isFinite(val)) {
      anyValuePresent = true;
      const varName = `v${idx}`;
      vars[varName] = val;
      const pattern = new RegExp(`['"]?${escapeRegExp(scope)}['"]?`, 'g');
      expr = expr.replace(pattern, varName);
    } else {
      missingScopes.push(normalized);
    }
  });

  if (!anyValuePresent && missingScopes.length === normalizedScopes.length) {
    return { value: undefined, error: undefined };
  }

  if (missingScopes.length > 0) {
    const uniqMissing = Array.from(new Set(missingScopes));
    return {
      value: undefined,
      error: `Please provide values for: ${uniqMissing.join(', ')}`,
    };
  }

  try {
    const parser = new Parser();
    const parsed = parser.parse(expr);
    const result = parsed.evaluate(vars);

    if (typeof result === 'number' && Number.isFinite(result)) {
      return { value: result, error: undefined };
    }
    return {
      value: undefined,
      error: 'Invalid expression result (not a finite number).',
    };
  } catch {
    return {
      value: undefined,
      error: 'Invalid expression syntax',
    };
  }
}

export function collectScopes(schema: JsonSchema | undefined, base: string = '#'): string[] {
  if (!schema || typeof schema !== 'object') return [];

  const scopes: string[] = [];

  if (schema.type === 'object' && schema.properties && typeof schema.properties === 'object') {
    Object.entries(schema.properties).forEach(([key, subschema]) => {
      const here = base === '#' ? `#/properties/${key}` : `${base}/${key}`;
      scopes.push(here);
      scopes.push(...collectScopes(subschema as JsonSchema, here));
    });
  }

  if (schema.type === 'array' && schema.items) {
    scopes.push(...collectScopes(schema.items as JsonSchema, base));
  }

  return Array.from(new Set(scopes));
}
