// eslint-disable-next-line
type AnyRecord = Record<string, any>;

const isObj = (v: unknown): v is AnyRecord => typeof v === 'object' && v !== null && !Array.isArray(v);

function joinPath(base: string, key: string) {
  return base ? `${base}.${key}` : key;
}
// eslint-disable-next-line
function collectRequiredPaths(schema: any, basePath = ''): string[] {
  if (!isObj(schema)) return [];
  const out: string[] = [];

  const req: string[] = Array.isArray(schema.required) ? schema.required : [];
  for (const k of req) out.push(joinPath(basePath, k));

  const props = schema.properties;
  if (isObj(props)) {
    for (const [k, sub] of Object.entries(props)) {
      out.push(...collectRequiredPaths(sub, joinPath(basePath, k)));
    }
  }

  return out;
}
// eslint-disable-next-line
function collectControllerKeys(ifSchema: any): string[] {
  if (!isObj(ifSchema)) return [];
  const keys = new Set<string>();

  if (isObj(ifSchema.properties)) {
    Object.keys(ifSchema.properties).forEach((k) => keys.add(k));
  }

  if (Array.isArray(ifSchema.required)) {
    // eslint-disable-next-line
    ifSchema.required.forEach((k: any) => typeof k === 'string' && keys.add(k));
  }

  return [...keys];
}
// eslint-disable-next-line
export function buildConditionalDeps(rootSchema: any): Map<string, string[]> {
  const deps = new Map<string, Set<string>>();
  // eslint-disable-next-line
  function walk(node: any) {
    if (!isObj(node)) return;

    // if/then/else
    if (node.if && (node.then || node.else)) {
      const controllers = collectControllerKeys(node.if);

      const thenReq = node.then ? collectRequiredPaths(node.then) : [];
      const elseReq = node.else ? collectRequiredPaths(node.else) : [];
      const affected = [...thenReq, ...elseReq].filter(Boolean);

      for (const c of controllers) {
        if (!deps.has(c)) deps.set(c, new Set<string>());
        const set = deps.get(c)!;
        for (const p of affected) set.add(p);
      }
    }

    // recurse common combinators
    for (const key of ['allOf', 'anyOf', 'oneOf']) {
      const arr = node[key];
      if (Array.isArray(arr)) arr.forEach(walk);
    }

    // also walk nested properties (optional but helpful)
    if (isObj(node.properties)) {
      Object.values(node.properties).forEach(walk);
    }
  }

  walk(rootSchema);

  // convert to Map<string,string[]>
  const out = new Map<string, string[]>();
  for (const [k, v] of deps.entries()) out.set(k, [...v]);
  return out;
}
