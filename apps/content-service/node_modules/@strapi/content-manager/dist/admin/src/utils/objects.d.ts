/**
 * Deeply get a value from an object via its path.
 */
export declare function getIn(obj: any, key: string | string[], def?: any, pathStartIndex?: number): any;
/** @internal is the given object an Object? */
export declare const isObject: (obj: any) => obj is object;
/** @internal is the given object an integer? */
export declare const isInteger: (obj: any) => boolean;
/**
 * Deeply set a value from in object via its path. If the value at `path`
 * has changed, return a shallow copy of obj with `value` set at `path`.
 * If `value` has not changed, return the original `obj`.
 *
 * Existing objects / arrays along `path` are also shallow copied. Sibling
 * objects along path retain the same internal js reference. Since new
 * objects / arrays are only created along `path`, we can test if anything
 * changed in a nested structure by comparing the object's reference in
 * the old and new object, similar to how russian doll cache invalidation
 * works.
 *
 * In earlier versions of this function, which used cloneDeep, there were
 * issues whereby settings a nested value would mutate the parent
 * instead of creating a new object. `clone` avoids that bug making a
 * shallow copy of the objects along the update path
 * so no object is mutated in place.
 *
 * Before changing this function, please read through the following
 * discussions.
 *
 * @see https://github.com/developit/linkstate
 * @see https://github.com/jaredpalmer/formik/pull/123
 */
export declare function setIn(obj: any, path: string, value: any): any;
