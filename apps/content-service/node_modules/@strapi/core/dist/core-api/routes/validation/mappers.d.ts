/**
 * @fileoverview
 * This file contains functions responsible for mapping Strapi attribute definitions to Zod schemas.
 */
import type { Schema } from '@strapi/types';
import * as z from 'zod/v4';
/**
 * Creates a Zod schema for a collection of Strapi attributes.
 *
 * @param attributes - An array of tuples, where each tuple contains the attribute name and its schema definition.
 * @returns A Zod object schema representing the combined attributes.
 *
 * @example
 * ```typescript
 * const myAttributes = [
 *   ['title', { type: 'string', required: true }],
 *   ['description', { type: 'text' }],
 * ];
 * const schema = createAttributesSchema(myAttributes);
 * // schema will be a Zod object with 'title' and 'description' fields,
 * // each mapped to their respective Zod schemas based on their Strapi attribute types.
 * ```
 */
export declare const createAttributesSchema: (attributes: [name: string, attribute: Schema.Attribute.AnyAttribute][]) => z.ZodObject<{}, z.core.$strip>;
/**
 * Creates a Zod input schema for a collection of Strapi attributes.
 * This is typically used for validating incoming data (e.g., from API requests).
 *
 * @param attributes - An array of tuples, where each tuple contains the attribute name and its schema definition.
 * @returns A Zod object schema representing the combined input attributes.
 *
 * @example
 * ```typescript
 * const myInputAttributes = [
 *   ['email', { type: 'email', required: true }],
 *   ['description', { type: 'text', minLength: 8 }],
 * ];
 * const inputSchema = createAttributesInputSchema(myInputAttributes);
 * // inputSchema will be a Zod object with 'email' and 'description' fields,
 * // mapped to Zod schemas suitable for input validation.
 * ```
 */
export declare const createAttributesInputSchema: (attributes: [name: string, attribute: Schema.Attribute.AnyAttribute][]) => z.ZodObject<{}, z.core.$strip>;
/**
 * Maps a Strapi attribute definition to a corresponding Zod validation schema.
 *
 * This function handles every Strapi attribute types and converts them into
 * appropriate Zod validation schemas.
 *
 * @param attribute - The Strapi attribute configuration object.
 * @returns A Zod schema that corresponds to the input attribute's type.
 * @throws {Error} Throws an error if an unsupported attribute type is provided.
 *
 * @example
 * ```typescript
 * const stringAttribute = { type: 'string', minLength: 3 };
 * const stringSchema = mapAttributeToSchema(stringAttribute); // Returns a Zod string schema with minLength.
 *
 * const booleanAttribute = { type: 'boolean', default: false };
 * const booleanSchema = mapAttributeToSchema(booleanAttribute); // Returns a Zod boolean schema with a default.
 * ```
 */
export declare const mapAttributeToSchema: (attribute: Schema.Attribute.AnyAttribute) => z.ZodTypeAny;
/**
 * Maps a Strapi attribute definition to a corresponding Zod input validation schema.
 *
 * This function handles every Strapi attribute types and converts them into
 * appropriate Zod validation schemas with their respective constraints.
 *
 * @param attribute - The Strapi attribute configuration object. Contains type information
 *                   and validation rules for the attribute.
 *
 * @returns A Zod schema that corresponds to the input attribute's type and validation rules
 *
 * @example
 * ```typescript
 * // String attribute with constraints
 * const stringAttribute = {
 *   type: 'string',
 *   minLength: 3,
 *   maxLength: 50,
 *   required: true
 * };
 * const stringSchema = mapAttributeToInputSchema(stringAttribute);
 *
 * // Enumeration attribute
 * const enumAttribute = {
 *   type: 'enumeration',
 *   enum: ['draft', 'published', 'archived']
 * };
 * const enumSchema = mapAttributeToInputSchema(enumAttribute);
 *
 * // Media attribute with multiple files
 * const mediaAttribute = {
 *   type: 'media',
 *   multiple: true
 * };
 * const mediaSchema = mapAttributeToInputSchema(mediaAttribute);
 * ```
 *
 * @throws {Error} Throws an error if an unsupported attribute type is provided
 *
 */
export declare const mapAttributeToInputSchema: (attribute: Schema.Attribute.AnyAttribute) => z.ZodTypeAny;
//# sourceMappingURL=mappers.d.ts.map