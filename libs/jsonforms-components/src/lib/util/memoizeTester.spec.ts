import { JsonSchema, RankedTester, TesterContext, UISchemaElement } from '@jsonforms/core';
import { memoizeRendererTesters, memoizeTester } from './memoizeTester';

const uischema = { type: 'Control', scope: '#/properties/name' } as UISchemaElement;
const schema: JsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
const rootSchema: JsonSchema = schema;
const context = { rootSchema, config: undefined } as unknown as TesterContext;

describe('memoizeTester', () => {
  it('returns the rank the wrapped tester produced', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;

    expect(memoizeTester(tester)(uischema, schema, context)).toBe(4);
  });

  it('only runs the wrapped tester once for repeated calls', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, context);
    memoized(uischema, schema, context);
    memoized(uischema, schema, context);

    expect(tester).toHaveBeenCalledTimes(1);
  });

  it('reuses the rank when the context wrapper is new but its contents are not', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, { rootSchema, config: undefined } as unknown as TesterContext);
    memoized(uischema, schema, { rootSchema, config: undefined } as unknown as TesterContext);

    expect(tester).toHaveBeenCalledTimes(1);
  });

  it('re-runs the tester for a different root schema', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, context);
    memoized(uischema, schema, { rootSchema: { type: 'object' }, config: undefined } as unknown as TesterContext);

    expect(tester).toHaveBeenCalledTimes(2);
  });

  it('re-runs the tester for a different config', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, { rootSchema, config: { a: 1 } } as unknown as TesterContext);
    memoized(uischema, schema, { rootSchema, config: { a: 1 } } as unknown as TesterContext);

    expect(tester).toHaveBeenCalledTimes(2);
  });

  it('re-runs the tester for a different ui schema element', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, context);
    memoized({ type: 'Control', scope: '#/properties/other' } as UISchemaElement, schema, context);

    expect(tester).toHaveBeenCalledTimes(2);
  });

  it('re-runs the tester for a different schema', () => {
    const tester = jest.fn().mockReturnValue(4) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, context);
    memoized(uischema, { type: 'object' }, context);

    expect(tester).toHaveBeenCalledTimes(2);
  });

  it('caches a negative rank so an inapplicable renderer is only tested once', () => {
    const tester = jest.fn().mockReturnValue(-1) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    expect(memoized(uischema, schema, context)).toBe(-1);
    expect(memoized(uischema, schema, context)).toBe(-1);
    expect(tester).toHaveBeenCalledTimes(1);
  });

  it('falls through to the tester when the arguments cannot be used as cache keys', () => {
    const tester = jest.fn().mockReturnValue(2) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(undefined as unknown as UISchemaElement, schema, context);
    memoized(undefined as unknown as UISchemaElement, schema, context);

    expect(tester).toHaveBeenCalledTimes(2);
  });

  it('still caches when the tester is called without a context', () => {
    const tester = jest.fn().mockReturnValue(2) as unknown as RankedTester;
    const memoized = memoizeTester(tester);

    memoized(uischema, schema, undefined as unknown as TesterContext);
    memoized(uischema, schema, undefined as unknown as TesterContext);

    expect(tester).toHaveBeenCalledTimes(1);
  });
});

describe('memoizeRendererTesters', () => {
  it('keeps each entry renderer and wraps only its tester', () => {
    const tester = jest.fn().mockReturnValue(3) as unknown as RankedTester;
    const renderer = () => null;

    const [entry] = memoizeRendererTesters([{ tester, renderer }]);

    expect(entry.renderer).toBe(renderer);
    expect(entry.tester).not.toBe(tester);
    expect(entry.tester(uischema, schema, context)).toBe(3);
  });

  it('gives each entry its own cache so one tester cannot answer for another', () => {
    const first = jest.fn().mockReturnValue(1) as unknown as RankedTester;
    const second = jest.fn().mockReturnValue(2) as unknown as RankedTester;

    const [a, b] = memoizeRendererTesters([
      { tester: first, renderer: () => null },
      { tester: second, renderer: () => null },
    ]);

    expect(a.tester(uischema, schema, context)).toBe(1);
    expect(b.tester(uischema, schema, context)).toBe(2);
  });
});
