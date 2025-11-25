type Primitive = string | number | boolean | null | undefined;
export type DeepRecord<T> = {
    [K in keyof T]: T[K] extends Primitive ? T[K] : DeepRecord<T[K]>;
};
export declare const recursiveRenameKeys: <T extends object>(obj: T, fn: (key: string) => string) => DeepRecord<T>;
export {};
