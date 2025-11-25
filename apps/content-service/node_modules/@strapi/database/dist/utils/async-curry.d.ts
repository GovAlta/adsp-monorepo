/**
 * @internal
 */
export declare const asyncCurry: <Args extends any[], R>(fn: (...args: Args) => Promise<R>) => CurriedAsyncFunction<Args, R>;
/**
 * @internal
 */
export type CurriedAsyncFunction<Args extends any[], R> = Args extends [infer First, ...infer Rest] ? Rest extends [] ? (arg: First) => Promise<R> : (arg: First) => CurriedAsyncFunction<Rest, R> : () => Promise<R>;
//# sourceMappingURL=async-curry.d.ts.map