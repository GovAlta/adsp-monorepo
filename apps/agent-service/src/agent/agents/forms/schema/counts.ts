export function countControlElements(node: unknown): number {
  if (!node || typeof node !== 'object') {
    return 0;
  }

  const record = node as Record<string, unknown>;
  if (record.type === 'Control') {
    return 1;
  }

  if (!Array.isArray(record.elements)) {
    return 0;
  }

  return record.elements.reduce((total: number, child) => total + countControlElements(child), 0);
}

export function collectControlScopes(node: unknown, results: string[] = []): string[] {
  if (!node || typeof node !== 'object') {
    return results;
  }

  const record = node as Record<string, unknown>;
  if (record.type === 'Control' && typeof record.scope === 'string') {
    results.push(record.scope);
    return results;
  }

  if (Array.isArray(record.elements)) {
    for (const child of record.elements) {
      collectControlScopes(child, results);
    }
  }

  return results;
}

export function countCategories(uiSchema: Record<string, unknown> | undefined): number {
  if (uiSchema?.type !== 'Categorization' || !Array.isArray(uiSchema.elements)) {
    return 0;
  }

  return uiSchema.elements.filter((element) => (element as Record<string, unknown>)?.type === 'Category').length;
}

export function countProperties(dataSchema: Record<string, unknown> | undefined): number {
  const properties = dataSchema?.properties;
  if (!properties || typeof properties !== 'object') {
    return 0;
  }

  return Object.keys(properties).length;
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
