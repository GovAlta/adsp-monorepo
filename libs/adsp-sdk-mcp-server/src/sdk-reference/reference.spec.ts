import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SDK_REFERENCE } from './reference';

const SDK_INDEX_PATH = resolve(__dirname, '../../../adsp-service-sdk/src/index.ts');

function getRootExportNames(indexSource: string): string[] {
  const names: string[] = [];
  const exportBlockPattern = /export\s+(?:type\s+)?\{([^}]*)\}/g;

  let match: RegExpExecArray | null;
  while ((match = exportBlockPattern.exec(indexSource))) {
    match[1]
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const [, alias] = /\bas\s+(\S+)/.exec(entry) ?? [];
        names.push(alias ?? entry);
      });
  }

  return names;
}

describe('SDK_REFERENCE coverage', () => {
  it('has an entry for every symbol exported from @abgov/adsp-service-sdk root index', () => {
    const indexSource = readFileSync(SDK_INDEX_PATH, 'utf8');
    const actualExports = getRootExportNames(indexSource);
    const referencedNames = new Set(SDK_REFERENCE.map((s) => s.name));

    const missing = actualExports.filter((name) => !referencedNames.has(name));

    expect(missing).toEqual([]);
  });

  it('has no stale entries for symbols that are no longer exported', () => {
    const indexSource = readFileSync(SDK_INDEX_PATH, 'utf8');
    const actualExports = new Set(getRootExportNames(indexSource));

    const stale = SDK_REFERENCE.map((s) => s.name).filter((name) => !actualExports.has(name));

    expect(stale).toEqual([]);
  });

  it('has no duplicate entries', () => {
    const names = SDK_REFERENCE.map((s) => s.name);

    expect(new Set(names).size).toBe(names.length);
  });
});
