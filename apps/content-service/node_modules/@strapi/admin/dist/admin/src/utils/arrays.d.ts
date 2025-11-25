/**
 * @internal
 * @description Mutates a value to be a union of flat values, no arrays allowed.
 */
type Flat<T> = T extends string ? T : T extends ArrayLike<any> ? never : T;
/**
 * @internal
 */
interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {
}
/**
 * @internal
 */
interface ArrayOfRecursiveArraysOrValues<T> extends ArrayLike<T | RecursiveArray<T>> {
}
/**
 * @internal
 *
 * @description Flattens an array recursively.
 */
declare const flattenDeep: <T>(array?: ArrayOfRecursiveArraysOrValues<T> | null | undefined) => Array<Flat<T>>;
export { flattenDeep };
export type { Flat, RecursiveArray, ArrayOfRecursiveArraysOrValues };
