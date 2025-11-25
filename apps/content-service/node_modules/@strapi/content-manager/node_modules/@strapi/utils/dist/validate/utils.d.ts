export declare const throwInvalidKey: ({ key, path }: {
    key: string;
    path?: string | null;
}) => never;
export declare const asyncCurry: <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => ((...args: Partial<A>) => any);
//# sourceMappingURL=utils.d.ts.map