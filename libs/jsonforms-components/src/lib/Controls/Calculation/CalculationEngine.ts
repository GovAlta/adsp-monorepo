import { Parser } from 'expr-eval';

export interface EvaluationResult {
  value?: number;
  error?: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function resolveScope(scope: string, data: unknown): unknown {
  if (!scope || typeof scope !== 'string') return undefined;

  const cleaned = scope.replace(/^#\/(properties\/)?/, '');
  const parts = cleaned.split('/').filter(Boolean);
  let cur: unknown = data;
  for (const part of parts) {
    if (cur == null) return undefined;

    if (Array.isArray(cur) && /^\d+$/.test(part)) {
      cur = cur[Number(part)];
    } else if (typeof cur === 'object') {
      if (part === 'properties') continue;
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function evaluateSum(scope: string | undefined, data: unknown): EvaluationResult {
  if (!scope || typeof scope !== 'string') {
    return { value: undefined, error: 'SUM() requires a JSON pointer argument.' };
  }

  const cleaned = scope.replace(/^#\/(properties\/)?/, '');
  const parts = cleaned.split('/').filter(Boolean);

  if (parts.length < 2) {
    return {
      value: undefined,
      error: `SUM() pointer "${scope}" must include an array and field name.`,
    };
  }

  const fieldKey = parts[parts.length - 1];
  const arrPath = parts.slice(0, -1);

  let cur: unknown = data;
  for (const segment of arrPath) {
    if (cur == null) {
      cur = undefined;
      break;
    }
    if (Array.isArray(cur) && /^\d+$/.test(segment)) {
      cur = cur[Number(segment)];
    } else if (typeof cur === 'object') {
      if (segment === 'properties') continue;
      cur = (cur as Record<string, unknown>)[segment];
    } else {
      cur = undefined;
      break;
    }
  }

  if (cur == null) {
    return {
      value: undefined,
      error: `Please provide values for: ${scope}`,
    };
  }

  if (!Array.isArray(cur)) {
    return {
      value: undefined,
      error: `SUM() pointer "${scope}" does not resolve to an array.`,
    };
  }

  const missingIndices: number[] = [];
  const invalidIndices: number[] = [];
  let sum = 0;

  for (let i = 0; i < cur.length; i++) {
    const row = cur[i];
    if (row == null || typeof row !== 'object') {
      missingIndices.push(i);
      continue;
    }

    const v = (row as Record<string, unknown>)[fieldKey];
    if (v === undefined || v === null || v === '') {
      missingIndices.push(i);
    } else if (typeof v !== 'number' || Number.isNaN(v)) {
      invalidIndices.push(i);
    } else {
      sum += v;
    }
  }

  if (invalidIndices.length > 0) {
    return {
      value: undefined,
      error: `Expected numeric values for: ${scope} at rows [${invalidIndices.join(', ')}]`,
    };
  }

  if (missingIndices.length === cur.length) {
    return {
      value: undefined,
      error: `Please provide values for: ${scope}`,
    };
  }

  return {
    value: sum,
    error: missingIndices.length ? `Some rows are missing values for: ${scope}` : undefined,
  };
}

/**
 * General expression evaluation.
 * - Supports SUM(#/properties/arr/c3)
 * - Supports arithmetic with JSON pointers:
 *   "#/properties/x * #/properties/y + #/properties/z"
 *
 * Returns { value, error } and NEVER throws.
 */
export function evaluateExpression(expression: string | undefined, data: unknown): EvaluationResult {
  if (!expression || typeof expression !== 'string') {
    return { value: undefined, error: undefined };
  }

  const trimmed = expression.trim();
  if (!trimmed) return { value: undefined, error: undefined };

  const sumMatch = trimmed.match(/^SUM\(\s*['"]?(.+?)['"]?\s*\)$/i);
  if (sumMatch) {
    const pointer = sumMatch[1];
    return evaluateSum(pointer, data);
  }

  const scopeRegex = /#\/(?:properties\/)?[^\s"')]+/g;
  const matches = trimmed.match(scopeRegex) || [];
  const uniqueScopes = Array.from(new Set(matches));

  let exprForParse = trimmed;
  const scopeToVar = new Map<string, string>();

  uniqueScopes.forEach((scope, index) => {
    const varName = `v${index}`;
    scopeToVar.set(scope, varName);

    const pattern = new RegExp(`['"]?${escapeRegExp(scope)}['"]?`, 'g');
    exprForParse = exprForParse.replace(pattern, varName);
  });

  let parsed;
  try {
    const parser = new Parser();
    parsed = parser.parse(exprForParse);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return {
      value: undefined,
      error: 'Invalid expression syntax',
    };
  }

  const vars: Record<string, number> = {};
  const missingScopes: string[] = [];
  const invalidTypeScopes: string[] = [];

  for (const scope of uniqueScopes) {
    const val = resolveScope(scope, data);

    if (val === undefined || val === null || val === '') {
      missingScopes.push(scope);
      continue;
    }

    if (typeof val !== 'number' || Number.isNaN(val)) {
      invalidTypeScopes.push(scope);
      continue;
    }

    const varName = scopeToVar.get(scope)!;
    vars[varName] = val;
  }

  if (invalidTypeScopes.length > 0) {
    return {
      value: undefined,
      error: `Expected numeric values for: ${invalidTypeScopes.join(', ')}`,
    };
  }

  if (missingScopes.length > 0) {
    return {
      value: undefined,
      error: `Please provide values for: ${missingScopes.join(', ')}`,
    };
  }

  try {
    const result = parsed.evaluate(vars);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return { value: result, error: undefined };
    }
    return {
      value: undefined,
      error: 'Expression did not produce a numeric result',
    };
  } catch {
    return {
      value: undefined,
      error: 'Error while evaluating expression',
    };
  }
}
