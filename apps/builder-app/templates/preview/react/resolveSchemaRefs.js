function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function documentUrl(ref) {
  const hash = ref.indexOf('#');
  return hash < 0 ? ref : ref.slice(0, hash);
}

function pointerTarget(document, pointer, ref) {
  if (!pointer || pointer === '/') {
    return document;
  }

  let node = document;
  for (const part of pointer.replace(/^\//, '').split('/')) {
    const key = decodeURIComponent(part).replace(/~1/g, '/').replace(/~0/g, '~');
    if (!isObject(node) && !Array.isArray(node)) {
      throw new Error(`Missing $ref pointer "${ref}".`);
    }

    node = node[key];
    if (node === undefined) {
      throw new Error(`Missing $ref pointer "${ref}". Token "${key}" does not exist.`);
    }
  }

  return node;
}

/**
 * Returns a copy of the schema with every $ref replaced by the definition it points to.
 *
 * Stands in for resolveRefs/tryResolveRefs from @abgov/jsonforms-components in the Builder preview. Those use
 * @apidevtools/json-schema-ref-parser, which resolves against location.href and fails for any schema when the page is
 * about:srcdoc, as it is in the preview iframe. References into the supplied schemas (for example
 * https://adsp.alberta.ca/common.v1.schema.json#/definitions/email) are matched by their $id; local refs
 * (#/definitions/...) are resolved against the document that contains them.
 *
 * Throws if a ref cannot be resolved or the refs are circular.
 */
export function resolveSchemaRefs(schema, ...refSchemas) {
  const documents = new Map();
  for (const refSchema of refSchemas) {
    if (typeof refSchema.$id === 'string') {
      documents.set(documentUrl(refSchema.$id), refSchema);
    }
  }

  const expand = (node, document, resolving) => {
    if (Array.isArray(node)) {
      return node.map((item) => expand(item, document, resolving));
    }

    if (!isObject(node)) {
      return node;
    }

    const { $ref: ref, ...rest } = node;
    const siblings = Object.entries(rest).reduce(
      (result, [key, value]) => ({ ...result, [key]: expand(value, document, resolving) }),
      {},
    );

    if (typeof ref !== 'string') {
      return siblings;
    }

    const hash = ref.indexOf('#');
    const url = documentUrl(ref);
    const pointer = hash < 0 ? '' : ref.slice(hash + 1);
    const target = url ? documents.get(url) : document;
    if (!target) {
      throw new Error(`Failed to resolve schema for: ${url}`);
    }

    const key = `${url || target.$id || ''}#${pointer}`;
    if (resolving.includes(key)) {
      throw new Error(`Circular $ref "${ref}" cannot be resolved.`);
    }

    const resolved = expand(pointerTarget(target, pointer, ref), target, [...resolving, key]);
    return isObject(resolved) ? { ...resolved, ...siblings } : resolved;
  };

  return expand(schema, schema, []);
}
