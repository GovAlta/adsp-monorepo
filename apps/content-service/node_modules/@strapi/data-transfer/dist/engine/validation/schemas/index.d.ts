import type { Diff } from '../../../utils/json';
declare const strategies: {
    exact(diffs: Diff[]): Diff[];
    strict(diffs: Diff[]): Diff[];
};
declare const compareSchemas: <T, P>(a: T, b: P, strategy: keyof typeof strategies) => Diff[];
export { compareSchemas };
//# sourceMappingURL=index.d.ts.map