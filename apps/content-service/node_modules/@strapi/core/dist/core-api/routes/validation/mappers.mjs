import * as z from 'zod/v4';
import { uidToSchema, timestampToSchema, timeToSchema, stringToSchema, relationToSchema, mediaToSchema, jsonToSchema, integerToSchema, floatToSchema, enumToSchema, emailToSchema, dynamicZoneToSchema, decimalToSchema, datetimeToSchema, dateToSchema, componentToSchema, booleanToSchema, blocksToSchema, bigIntegerToSchema, uidToInputSchema, timestampToInputSchema, timeToInputSchema, textToInputSchema, relationToInputSchema, mediaToInputSchema, jsonToInputSchema, integerToInputSchema, floatToInputSchema, enumerationToInputSchema, emailToInputSchema, dynamicZoneToInputSchema, decimalToInputSchema, datetimeToInputSchema, dateToInputSchema, componentToInputSchema, booleanToInputSchema, blocksToInputSchema, bigIntegerToInputSchema } from './attributes.mjs';

const isCustomFieldAttribute = (attribute)=>{
    return !!attribute && typeof attribute === 'object' && attribute.type === 'customField' && typeof attribute.customField === 'string';
};
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
 */ const createAttributesSchema = (attributes)=>{
    return attributes.reduce((acc, [name, attribute])=>{
        return acc.extend({
            get [name] () {
                return mapAttributeToSchema(attribute);
            }
        });
    }, z.object({}));
};
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
 */ const createAttributesInputSchema = (attributes)=>{
    return attributes.reduce((acc, [name, attribute])=>{
        return acc.extend({
            get [name] () {
                return mapAttributeToInputSchema(attribute);
            }
        });
    }, z.object({}));
};
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
 */ const mapAttributeToSchema = (attribute)=>{
    switch(attribute.type){
        case 'biginteger':
            return bigIntegerToSchema(attribute);
        case 'blocks':
            return blocksToSchema();
        case 'boolean':
            return booleanToSchema(attribute);
        case 'component':
            return componentToSchema(attribute);
        case 'date':
            return dateToSchema(attribute);
        case 'datetime':
            return datetimeToSchema(attribute);
        case 'decimal':
            return decimalToSchema(attribute);
        case 'dynamiczone':
            return dynamicZoneToSchema(attribute);
        case 'email':
            return emailToSchema(attribute);
        case 'enumeration':
            return enumToSchema(attribute);
        case 'float':
            return floatToSchema(attribute);
        case 'integer':
            return integerToSchema(attribute);
        case 'json':
            return jsonToSchema(attribute);
        case 'media':
            return mediaToSchema(attribute);
        case 'relation':
            return relationToSchema(attribute);
        case 'password':
        case 'text':
        case 'richtext':
        case 'string':
            return stringToSchema(attribute);
        case 'time':
            return timeToSchema(attribute);
        case 'timestamp':
            return timestampToSchema(attribute);
        case 'uid':
            return uidToSchema(attribute);
        default:
            {
                if (isCustomFieldAttribute(attribute)) {
                    const attrCF = attribute;
                    const strapiInstance = global.strapi;
                    if (!strapiInstance) {
                        throw new Error('Strapi instance not available for custom field conversion');
                    }
                    const customField = strapiInstance.get('custom-fields').get(attrCF.customField);
                    if (!customField) {
                        throw new Error(`Custom field '${attrCF.customField}' not found`);
                    }
                    // Re-dispatch with the resolved underlying Strapi kind
                    return mapAttributeToSchema({
                        ...attrCF,
                        type: customField.type
                    });
                }
                const { type } = attribute;
                throw new Error(`Unsupported attribute type: ${type}`);
            }
    }
};
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
 */ const mapAttributeToInputSchema = (attribute)=>{
    switch(attribute.type){
        case 'biginteger':
            return bigIntegerToInputSchema(attribute);
        case 'blocks':
            return blocksToInputSchema();
        case 'boolean':
            return booleanToInputSchema(attribute);
        case 'component':
            return componentToInputSchema(attribute);
        case 'date':
            return dateToInputSchema(attribute);
        case 'datetime':
            return datetimeToInputSchema(attribute);
        case 'decimal':
            return decimalToInputSchema(attribute);
        case 'dynamiczone':
            return dynamicZoneToInputSchema(attribute);
        case 'email':
            return emailToInputSchema(attribute);
        case 'enumeration':
            return enumerationToInputSchema(attribute);
        case 'float':
            return floatToInputSchema(attribute);
        case 'integer':
            return integerToInputSchema(attribute);
        case 'json':
            return jsonToInputSchema(attribute);
        case 'media':
            return mediaToInputSchema(attribute);
        case 'relation':
            return relationToInputSchema(attribute);
        case 'password':
        case 'text':
        case 'richtext':
        case 'string':
            return textToInputSchema(attribute);
        case 'time':
            return timeToInputSchema(attribute);
        case 'timestamp':
            return timestampToInputSchema(attribute);
        case 'uid':
            return uidToInputSchema(attribute);
        default:
            {
                if (isCustomFieldAttribute(attribute)) {
                    const attrCF = attribute;
                    const strapiInstance = global.strapi;
                    if (!strapiInstance) {
                        throw new Error('Strapi instance not available for custom field conversion');
                    }
                    const customField = strapiInstance.get('custom-fields').get(attrCF.customField);
                    if (!customField) {
                        throw new Error(`Custom field '${attrCF.customField}' not found`);
                    }
                    // Re-dispatch with the resolved underlying Strapi kind
                    return mapAttributeToInputSchema({
                        ...attrCF,
                        type: customField.type
                    });
                }
                const { type } = attribute;
                throw new Error(`Unsupported attribute type: ${type}`);
            }
    }
};

export { createAttributesInputSchema, createAttributesSchema, mapAttributeToInputSchema, mapAttributeToSchema };
//# sourceMappingURL=mappers.mjs.map
