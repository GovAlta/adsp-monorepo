/**
 * @file This file contains utility functions for working with Zod schemas.
 * It provides functions to modify schemas (e.g., make them optional, readonly, or add default values),
 * and to safely register and create schemas within Zod's global registry.
 */
import * as z from 'zod/v4';
/**
 * Transforms a Strapi UID into an OpenAPI-compliant component name.
 *
 * @param uid - The Strapi UID to transform (e.g., "basic.seo", "api::category.category", "plugin::upload.file")
 * @returns The OpenAPI-compliant component name (e.g., "BasicSeoEntry", "ApiCategoryCategoryDocument", "PluginUploadFileDocument")
 */
export declare const transformUidToValidOpenApiName: (uid: string) => string;
/**
 * Conditionally makes a Zod schema optional based on the `required` parameter.
 *
 * @param required - If `false` or `undefined`, the schema will be made optional. If `true`, the schema becomes non-optional.
 * @returns A function that takes a Zod schema and returns a modified schema (optional or required).
 * @example
 * ```typescript
 * const optionalString = maybeRequired(false)(z.string()); // z.ZodOptional<z.ZodString>
 *
 * const requiredString = maybeRequired(true)(z.string());  // z.ZodString
 * ```
 */
export declare const maybeRequired: (required?: boolean) => <T extends z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>(schema: T) => z.ZodOptional<T> | z.ZodNonOptional<T>;
/**
 * Conditionally makes a Zod schema readonly based on the `writable` parameter.
 *
 * @param writable - If `false`, the schema will be made readonly. If `true` or `undefined`, the schema remains unchanged.
 * @returns A function that takes a Zod schema and returns a modified schema (readonly or original).
 * @example
 * ```typescript
 * const readonlyNumber = maybeReadonly(false)(z.number()); // z.ZodReadonly<z.ZodNumber>
 * const writableNumber = maybeReadonly(true)(z.number());  // z.ZodNumber
 * ```
 */
export declare const maybeReadonly: (writable?: boolean) => <T extends z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>(schema: T) => T | z.ZodReadonly<T>;
/**
 * Conditionally adds a default value to a Zod schema based on the `defaultValue` parameter.
 *
 * @param defaultValue - The default value to apply to the schema. If `undefined`, no default value is added.
 *                       If `defaultValue` is a function, its return value will be used as the default.
 * @returns A function that takes a Zod schema and returns a modified schema (with default or original).
 * @example
 * ```typescript
 * const stringWithDefault = maybeWithDefault("default")(z.string()); // z.ZodDefault<z.ZodString>
 * const numberWithFunctionDefault = maybeWithDefault(() => Math.random())(z.number());
 * ```
 */
export declare const maybeWithDefault: (defaultValue?: unknown) => <T extends z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>(schema: T) => T | z.ZodDefault<T>;
/**
 * Conditionally applies `min` and `max` constraints to a Zod string, number, or array schema.
 *
 * @param min - The minimum value/length. If `undefined`, no minimum constraint is applied.
 * @param max - The maximum value/length. If `undefined`, no maximum constraint is applied.
 * @returns A function that takes a Zod string, number, or array schema and returns a modified schema (with min/max constraints or original).
 * @example
 * ```typescript
 * const stringWithMinMax = maybeWithMinMax(5, 10)(z.string()); // z.ZodString with min(5) and max(10)
 * const numberWithMinMax = maybeWithMinMax(0, 100)(z.number()); // z.ZodNumber with min(0) and max(100)
 * ```
 */
export declare const maybeWithMinMax: (min?: number, max?: number) => <R extends z.ZodString | z.ZodNumber | z.ZodEmail | z.ZodArray<z.ZodAny>>(schema: R) => z.ZodString | z.ZodNumber | z.ZodEmail | z.ZodArray<z.ZodAny>;
/**
 * Applies a series of modifier functions to a Zod schema sequentially.
 *
 * @template T - The type of the Zod schema.
 * @param schema - The initial Zod schema to which modifiers will be applied.
 * @param modifiers - An array of functions, each taking a Zod schema and returning a modified schema.
 * @returns The final Zod schema after all modifiers have been applied.
 * @example
 * ```typescript
 * const modifiedSchema = augmentSchema(z.string(), [
 *   maybeRequired(false),
 *   maybeWithDefault("test")
 * ]);
 * ```
 */
export declare const augmentSchema: <T extends z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>(schema: T, modifiers: ((schema: T) => z.Schema)[]) => T;
//# sourceMappingURL=utilities.d.ts.map