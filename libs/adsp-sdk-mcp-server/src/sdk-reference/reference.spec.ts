import { relative, resolve, sep } from 'path';
import * as ts from 'typescript';
import { SDK_REFERENCE, SdkSymbolDoc, SdkSymbolKind } from './reference';

const SDK_SRC_PATH = resolve(__dirname, '../../../adsp-service-sdk/src');
const SDK_INDEX_PATH = resolve(SDK_SRC_PATH, 'index.ts');

interface ActualExport {
  kind: SdkSymbolKind | 'unknown';
  module: string;
  deprecated: boolean;
}

/** A const counts as a function when it can be called, e.g. an arrow function or a factory-made formatter. */
function kindOf(symbol: ts.Symbol, checker: ts.TypeChecker): ActualExport['kind'] {
  const { flags } = symbol;
  if (flags & ts.SymbolFlags.Class) return 'class';
  if (flags & ts.SymbolFlags.Interface) return 'interface';
  if (flags & ts.SymbolFlags.TypeAlias) return 'type';
  if (flags & ts.SymbolFlags.Enum) return 'enum';
  if (flags & ts.SymbolFlags.Function) return 'function';
  if (flags & ts.SymbolFlags.Variable) {
    return checker.getTypeOfSymbol(symbol).getCallSignatures().length > 0 ? 'function' : 'const';
  }
  return 'unknown';
}

/** Module as the reference names it: the first path segment under the SDK's src/, without extension. */
function moduleOf(declaration: ts.Declaration): string {
  const [first] = relative(SDK_SRC_PATH, declaration.getSourceFile().fileName).split(sep);
  return first.replace(/\.ts$/, '');
}

/** Every root export of @abgov/adsp-service-sdk, resolved through re-exports by the TypeScript compiler. */
function readRootExports(): Map<string, ActualExport> {
  const program = ts.createProgram([SDK_INDEX_PATH], { skipLibCheck: true, noEmit: true });
  const checker = program.getTypeChecker();
  const indexFile = program.getSourceFile(SDK_INDEX_PATH);
  const moduleSymbol = indexFile && checker.getSymbolAtLocation(indexFile);
  if (!moduleSymbol) {
    throw new Error(`Could not load the SDK index at ${SDK_INDEX_PATH}`);
  }

  const exports = new Map<string, ActualExport>();
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const [declaration] = symbol.declarations ?? [];
    if (!declaration) {
      throw new Error(`SDK export ${exported.name} has no declaration`);
    }

    exports.set(exported.name, {
      kind: kindOf(symbol, checker),
      module: moduleOf(declaration),
      deprecated: symbol.getJsDocTags(checker).some((tag) => tag.name === 'deprecated'),
    });
  }
  return exports;
}

/** A decorator is a function in the compiler's eyes; the reference names it for what it is used as. */
function kindMatches(documented: SdkSymbolKind, actual: ActualExport['kind']): boolean {
  return documented === actual || (documented === 'decorator' && actual === 'function');
}

function describeDrift(doc: SdkSymbolDoc, actual: ActualExport): string[] {
  const drift: string[] = [];
  if (!kindMatches(doc.kind, actual.kind)) {
    drift.push(`${doc.name}: kind is ${actual.kind}, reference says ${doc.kind}`);
  }
  if (doc.module !== actual.module) {
    drift.push(`${doc.name}: module is ${actual.module}, reference says ${doc.module}`);
  }
  if (!!doc.deprecated !== actual.deprecated) {
    drift.push(`${doc.name}: deprecated is ${actual.deprecated}, reference says ${!!doc.deprecated}`);
  }
  return drift;
}

describe('SDK_REFERENCE matches @abgov/adsp-service-sdk', () => {
  let actualExports: Map<string, ActualExport>;

  beforeAll(() => {
    actualExports = readRootExports();
  }, 60_000);

  it('has an entry for every symbol exported from the SDK root index', () => {
    const referencedNames = new Set(SDK_REFERENCE.map((s) => s.name));

    expect([...actualExports.keys()].filter((name) => !referencedNames.has(name))).toEqual([]);
  });

  it('has no stale entries for symbols that are no longer exported', () => {
    expect(SDK_REFERENCE.map((s) => s.name).filter((name) => !actualExports.has(name))).toEqual([]);
  });

  it("matches each export's kind, module and deprecated flag", () => {
    const drift = SDK_REFERENCE.flatMap((doc) => {
      const actual = actualExports.get(doc.name);
      return actual ? describeDrift(doc, actual) : [];
    });

    expect(drift).toEqual([]);
  });

  it('only cross-references symbols that have entries', () => {
    const referencedNames = new Set(SDK_REFERENCE.map((s) => s.name));
    const dangling = SDK_REFERENCE.flatMap(({ name, seeAlso = [] }) =>
      seeAlso.filter((target) => !referencedNames.has(target)).map((target) => `${name} → ${target}`),
    );

    expect(dangling).toEqual([]);
  });

  it('has no duplicate entries', () => {
    const names = SDK_REFERENCE.map((s) => s.name);

    expect(new Set(names).size).toBe(names.length);
  });
});
