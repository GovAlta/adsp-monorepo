import {
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  RankedTester,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';

/**
 * JsonForms picks a renderer by running every registered tester against the control. Most of the
 * stock testers resolve the control's subschema out of the root schema to do it, and on a schema
 * built from a long chain of `allOf`/`if`/`oneOf` that resolve walks the whole combinator tree.
 * With ~25 renderers registered that is ~26 root-schema walks per control, and a step change
 * remounts every control on the page — those walks are the largest single cost in a transition.
 *
 * The rank a tester returns is a pure function of its three arguments, so it can be cached against
 * their identities. The ui schema element, the schema and the root schema are all long-lived
 * objects. The `context` wrapper is not: JsonForms builds it in a `useMemo` inside the dispatch
 * component, so a remount produces a fresh wrapper around the very same root schema. Keying on the
 * wrapper therefore never hits on the path that matters, and the cache has to reach through it.
 */

// Stand-ins so calls that omit a context, a root schema or a config stay cacheable instead of
// dropping to the uncached path. WeakMap keys have to be objects.
const ABSENT: object = {};

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

const keyFor = (value: unknown): object => (isObject(value) ? value : ABSENT);

type ConfigCache = WeakMap<object, number>;
type RootSchemaCache = WeakMap<object, ConfigCache>;
type SchemaCache = WeakMap<object, RootSchemaCache>;

const getOrCreate = <K extends object, V>(map: WeakMap<K, V>, key: K, create: () => V): V => {
  let value = map.get(key);
  if (value === undefined) {
    value = create();
    map.set(key, value);
  }
  return value;
};

export const memoizeTester = (tester: RankedTester): RankedTester => {
  const cache = new WeakMap<object, SchemaCache>();

  return (uischema: UISchemaElement, schema: JsonSchema, context: TesterContext): number => {
    if (!isObject(uischema) || !isObject(schema)) {
      return tester(uischema, schema, context);
    }

    const bySchema = getOrCreate(cache, uischema, () => new WeakMap() as SchemaCache);
    const byRootSchema = getOrCreate(bySchema, schema, () => new WeakMap() as RootSchemaCache);
    const byConfig = getOrCreate(byRootSchema, keyFor(context?.rootSchema), () => new WeakMap() as ConfigCache);
    const configKey = keyFor(context?.config);

    const cached = byConfig.get(configKey);
    if (cached !== undefined) {
      return cached;
    }

    const rank = tester(uischema, schema, context);
    byConfig.set(configKey, rank);
    return rank;
  };
};

export const memoizeRendererTesters = (
  entries: JsonFormsRendererRegistryEntry[]
): JsonFormsRendererRegistryEntry[] => entries.map((entry) => ({ ...entry, tester: memoizeTester(entry.tester) }));
