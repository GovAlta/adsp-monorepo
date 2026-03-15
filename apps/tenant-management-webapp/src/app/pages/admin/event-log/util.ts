type ValidateResult = {
  ok: boolean;
  namespace?: string;
  name?: string;
  key?: string;
  reason?: string;
};
export function validateEventKey(
  input: string,
  eventKeys: string[],
  opts?: {
    namespaceException?: string;
    caseSensitive?: boolean;
  },
): ValidateResult {
  const namespaceException = opts?.namespaceException ?? 'access-service';
  const caseSensitive = opts?.caseSensitive ?? true;

  const raw = (input ?? '').trim();
  if (!raw) return { ok: false, reason: 'Empty value' };

  const idx = raw.indexOf(':');
  if (idx <= 0 || idx === raw.length - 1) {
    return { ok: false, reason: 'Must be in namespace:name format' };
  }

  const ns = raw.slice(0, idx).trim();
  const nm = raw.slice(idx + 1).trim();
  if (!ns || !nm) return { ok: false, reason: 'Namespace and name are required' };

  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());

  const keySet = new Set(eventKeys.map(norm));

  const nsNorm = norm(ns);
  const fullKeyNorm = norm(`${ns}:${nm}`);

  if (nsNorm === norm(namespaceException)) {
    const namespaceExists = eventKeys.some((k) => {
      const i = k.indexOf(':');
      if (i <= 0) return false;
      return norm(k.slice(0, i).trim()) === nsNorm;
    });

    if (!namespaceExists) {
      return { ok: false, reason: `Namespace "${ns}" does not exist` };
    }

    return { ok: true, namespace: ns, name: nm, key: `${ns}:${nm}` };
  }

  if (!keySet.has(fullKeyNorm)) {
    return { ok: false, reason: `"${ns}:${nm}" is not a valid event key` };
  }

  return { ok: true, namespace: ns, name: nm, key: `${ns}:${nm}` };
}
