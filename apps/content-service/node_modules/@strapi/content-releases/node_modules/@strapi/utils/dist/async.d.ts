type AnyFunc<TA extends any[] = any[], TR = any> = (...args: TA) => TR;
type MakeProm<T> = Promise<T extends PromiseLike<infer I> ? I : T>;
type PipeReturn<F extends AnyFunc[]> = MakeProm<ReturnType<F[0]>>;
export declare function pipe<T extends AnyFunc[]>(...fns: PipeReturn<T> extends never ? never : T): (...args: Parameters<T[0]>) => PipeReturn<T>;
export declare const map: (...args: any[]) => any;
export declare const reduce: (mixedArray: any[]) => <T>(iteratee: AnyFunc, initialValue?: T) => Promise<T | undefined>;
export {};
//# sourceMappingURL=async.d.ts.map