/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Create a promise and get access to its `resolve` and `reject` functions.
 *
 * Mirrors `Promise.withResolvers()`, available starting from Node 22.
 * TODO: Remove once Node 22 becomes the minimum supported version.
 */
export function withResolver() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve: resolve, reject: reject };
}
