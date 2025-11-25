declare const isError: (err: unknown) => err is Error;
/**
 * @description Handle unexpected errors. No, but really, your CLI should anticipate error cases.
 * If a user hits an error we don't expect, then we need to flag to them that this is not normal
 * and they should use the `--debug` flag to get more information (assuming you've implemented this
 * in your action).
 */
declare const handleUnexpectedError: (err: unknown) => never;
export { handleUnexpectedError, isError };
//# sourceMappingURL=errors.d.ts.map