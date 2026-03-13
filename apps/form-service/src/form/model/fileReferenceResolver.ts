import { AdspId } from '@abgov/adsp-service-sdk';

export type FileUrnPathTemplate = string[];

export function collectFileUrnPathTemplates(schema: unknown, pathTemplate: FileUrnPathTemplate = []): FileUrnPathTemplate[] {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const typedSchema = schema as {
    type?: string | string[];
    format?: string;
    properties?: Record<string, unknown>;
    items?: unknown;
    anyOf?: unknown[];
    oneOf?: unknown[];
    allOf?: unknown[];
  };

  const result: FileUrnPathTemplate[] = [];
  const schemaType = Array.isArray(typedSchema.type) ? typedSchema.type : [typedSchema.type];
  const allowsString = schemaType.includes('string');
  const allowsObject = schemaType.includes('object') || schemaType.includes(undefined);
  const allowsArray = schemaType.includes('array') || schemaType.includes(undefined);

  if (allowsString && typedSchema.format === 'file-urn' && pathTemplate.length > 0) {
    result.push(pathTemplate);
  }

  if (allowsObject && typedSchema.properties && typeof typedSchema.properties === 'object') {
    for (const [key, childSchema] of Object.entries(typedSchema.properties)) {
      result.push(...collectFileUrnPathTemplates(childSchema, [...pathTemplate, key]));
    }
  }

  if (allowsArray && typedSchema.items) {
    result.push(...collectFileUrnPathTemplates(typedSchema.items, [...pathTemplate, '*']));
  }

  for (const branch of typedSchema.anyOf || []) {
    result.push(...collectFileUrnPathTemplates(branch, pathTemplate));
  }
  for (const branch of typedSchema.oneOf || []) {
    result.push(...collectFileUrnPathTemplates(branch, pathTemplate));
  }
  for (const branch of typedSchema.allOf || []) {
    result.push(...collectFileUrnPathTemplates(branch, pathTemplate));
  }

  const seen = new Set<string>();
  return result.filter((template) => {
    const key = template.join('.');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function resolveFileReferences(
  data: Record<string, unknown>,
  pathTemplates: FileUrnPathTemplate[]
): Record<string, AdspId> {
  if (!data) {
    return {};
  }

  return pathTemplates.reduce<Record<string, AdspId>>((files, pathTemplate) => {
    const values = resolvePathValues(data, pathTemplate);
    return values.reduce<Record<string, AdspId>>((resolved, { path, value }) => {
      if (typeof value !== 'string') {
        return resolved;
      }

      try {
        const urn = AdspId.parse(value);
        if (urn.type === 'resource' && urn.service === 'file-service') {
          return { ...resolved, [path]: urn };
        }
      } catch {
        // Draft data may contain incomplete/invalid values; skip non-file URNs.
      }

      return resolved;
    }, files);
  }, {});
}

function resolvePathValues(
  value: unknown,
  pathTemplate: FileUrnPathTemplate,
  index = 0,
  concretePath = ''
): Array<{ path: string; value: unknown }> {
  if (index >= pathTemplate.length) {
    return concretePath ? [{ path: concretePath, value }] : [];
  }

  const segment = pathTemplate[index];
  if (segment === '*') {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((item, itemIndex) =>
      resolvePathValues(item, pathTemplate, index + 1, `${concretePath}[${itemIndex}]`)
    );
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const record = value as Record<string, unknown>;
  if (!(segment in record)) {
    return [];
  }

  const nextPath = concretePath ? `${concretePath}.${segment}` : segment;
  return resolvePathValues(record[segment], pathTemplate, index + 1, nextPath);
}
