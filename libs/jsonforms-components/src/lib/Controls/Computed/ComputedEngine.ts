import { Parser } from 'expr-eval';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function resolveScope(scope: string, data: unknown): unknown {
  if (!scope || typeof scope !== 'string') return undefined;

  const cleaned = scope.replace(/^#\/(properties\/)?/, '');
  const parts = cleaned.split('/').filter(Boolean);
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function sumColumn(scope: string, data: unknown): number | undefined {
  if (!scope || typeof scope !== 'string') return undefined;
  // normalize scope: remove leading "#/" and optional "properties/"
  const cleaned = scope.replace(/^#\/(properties\/)?/, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) return undefined;

  const colKey = parts[parts.length - 1];
  const arrPath = parts.slice(0, -1);

  let cur: unknown = data;
  for (const p of arrPath) {
    if (cur == null) return undefined;
    // handle numeric indices for arrays
    if (Array.isArray(cur) && /^\d+$/.test(p)) {
      cur = (cur as unknown[])[Number(p)];
    } else {
      cur = (cur as Record<string, unknown>)[p];
    }
  }

  if (!Array.isArray(cur)) return undefined;

  let sum = 0;
  for (const row of cur) {
    if (row == null) return undefined;
    const v = (row as Record<string, unknown>)[colKey];
    if (typeof v !== 'number') return undefined;
    sum += v;
  }
  return sum;
}

export function evaluateExpression(expression: string, data: unknown): number | undefined {
  if (!expression || typeof expression !== 'string') return undefined;
  const trimmed = expression.trim();

  const sumMatch = trimmed.match(/^SUM\(\s*['"]?(.+?)['"]?\s*\)$/i);
  if (sumMatch) {
    return sumColumn(sumMatch[1], data);
  }

  // Find unique scope tokens like #/properties/x or #/arr/0/c3
  const scopeRegex = /#\/(?:properties\/)?[^\s"')]+/g;
  const matches = trimmed.match(scopeRegex) || [];
  const uniqueScopes = Array.from(new Set(matches));

  // Prepare variable mapping for expr-eval
  const vars: Record<string, number> = {};
  let expr = trimmed;

  for (let i = 0; i < uniqueScopes.length; i++) {
    const scope = uniqueScopes[i];
    const val = resolveScope(scope, data);
    if (val === undefined || typeof val !== 'number') return undefined;
    const varName = `v${i}`;
    vars[varName] = val;
    const pattern = new RegExp(`['"]?${escapeRegExp(scope)}['"]?`, 'g');
    expr = expr.replace(pattern, varName);
  }

  // Evaluate with expr-eval parser
  try {
    const parser = new Parser();
    const parsed = parser.parse(expr);
    const result = parsed.evaluate(vars);
    return typeof result === 'number' && Number.isFinite(result) ? result : undefined;
  } catch {
    return undefined;
  }
}
