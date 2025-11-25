import * as z from 'zod/v4';
import type { OpenAPIV3_1 } from 'openapi-types';
/**
 * Converts a Zod schema to an OpenAPI Schema Object.
 *
 * @description
 * Takes a Zod schema and converts it into an OpenAPI Schema Object (v3.1).
 * It uses a local registry to handle the conversion process and generates the appropriate
 * OpenAPI components.
 *
 * @param zodSchema - The Zod schema to convert to OpenAPI format. Can be any valid Zod schema.
 *
 * @returns An OpenAPI Schema Object representing the input Zod schema structure.
 * If the conversion cannot be completed, returns undefined.
 *
 * @example
 * ```typescript
 * import * as z from 'zod/v4';
 *
 * // Create a Zod schema
 * const userSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * // Convert to OpenAPI schema
 * const openAPISchema = zodToOpenAPI(userSchema);
 * ```
 */
export declare const zodToOpenAPI: (zodSchema: z.ZodType) => OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
/**
 * Generates a path string for referencing a component schema by its identifier.
 *
 * @param id - The identifier of the component schema.
 * @returns The constructed path string for the specified component schema.
 */
export declare const toComponentsPath: (id: string) => string;
//# sourceMappingURL=zod.d.ts.map