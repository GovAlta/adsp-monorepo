/**
 * Create a strict interpolation RegExp based on the given variables' name
 */
declare const createStrictInterpolationRegExp: (allowedVariableNames: string[], flags: string) => RegExp;
/**
 * Create a loose interpolation RegExp to match as many groups as possible
 */
declare const createLooseInterpolationRegExp: (flags: string) => RegExp;
export { createStrictInterpolationRegExp, createLooseInterpolationRegExp };
//# sourceMappingURL=template.d.ts.map