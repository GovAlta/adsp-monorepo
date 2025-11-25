type ObjectDiff<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown> ? ObjectDiff<T[P]> : T[P];
};
declare function difference<T extends Record<string, unknown>>(object: T, base: T): ObjectDiff<T>;
export { difference };
