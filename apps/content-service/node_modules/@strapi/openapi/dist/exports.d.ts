import type { Core } from '@strapi/types';
import type { GenerationOptions } from './types';
import type { GeneratorOutput } from './generator';
/**
 * Generates an in-memory OpenAPI specification for Strapi routes.
 *
 * @experimental
 *
 * @param strapi - The Strapi application instance.
 * @param options - Optional configuration for the generation process.
 * @param options.type - The type of routes to generate documentation for, either 'admin' or 'content-api'.
 *                       Defaults to 'content-api'.
 * @returns An object containing the generated OpenAPI document and other relevant outputs.
 *
 * @example
 * ```typescript
 * import { generate } from '@strapi/openapi';
 *
 * // Assuming 'strapi' is your Strapi instance
 * const output = generate(strapi, { type: 'content-api' });
 * console.log(output.document);
 * ```
 *
 * @example
 * ```typescript
 * import { generate } from '@strapi/openapi';
 *
 * // Generate documentation for all route types (default)
 * const output = generate(strapi);
 * console.log(output.document);
 * ```
 */
export declare const generate: (strapi: Core.Strapi, options?: GenerationOptions) => GeneratorOutput;
export type { GenerationOptions, GeneratorOutput };
//# sourceMappingURL=exports.d.ts.map