/**
 * Compute differences between two JSON objects and returns them
 *
 * @param a - First object
 * @param b - Second object
 * @param ctx - Context used to keep track of the current path during recursion
 */
export declare const diff: (a: unknown, b: unknown, ctx?: Context) => Diff[];
export interface AddedDiff<T = unknown> {
    kind: 'added';
    path: string[];
    type: string;
    value: T;
}
export interface ModifiedDiff<T = unknown, P = unknown> {
    kind: 'modified';
    path: string[];
    types: [string, string];
    values: [T, P];
}
export interface DeletedDiff<T = unknown> {
    kind: 'deleted';
    path: string[];
    type: string;
    value: T;
}
export type Diff<T = unknown> = AddedDiff<T> | ModifiedDiff<T> | DeletedDiff<T>;
export interface Context {
    path: string[];
}
//# sourceMappingURL=json.d.ts.map