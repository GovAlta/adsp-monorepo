import slugify from '@sindresorhus/slugify';
declare const nameToSlug: (name: string, options?: slugify.Options) => string;
declare const nameToCollectionName: (name: string) => string;
declare const toRegressedEnumValue: (value: string) => string;
declare const getCommonPath: (...paths: string[]) => string;
declare const isEqual: (a: unknown, b: unknown) => boolean;
declare const isCamelCase: (value: string) => boolean;
declare const isKebabCase: (value: string) => boolean;
declare const startsWithANumber: (value: string) => boolean;
declare const joinBy: (joint: string, ...args: string[]) => string;
declare const toKebabCase: (value: string) => string;
export { nameToSlug, nameToCollectionName, getCommonPath, isEqual, isCamelCase, isKebabCase, toKebabCase, toRegressedEnumValue, startsWithANumber, joinBy, };
//# sourceMappingURL=strings.d.ts.map