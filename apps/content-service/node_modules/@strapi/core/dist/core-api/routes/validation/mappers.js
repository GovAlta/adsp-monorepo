'use strict';

var z = require('zod/v4');
var attributes = require('./attributes.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var z__namespace = /*#__PURE__*/_interopNamespaceDefault(z);

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
    }, z__namespace.object({}));
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
    }, z__namespace.object({}));
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
            return attributes.bigIntegerToSchema(attribute);
        case 'blocks':
            return attributes.blocksToSchema();
        case 'boolean':
            return attributes.booleanToSchema(attribute);
        case 'component':
            return attributes.componentToSchema(attribute);
        case 'date':
            return attributes.dateToSchema(attribute);
        case 'datetime':
            return attributes.datetimeToSchema(attribute);
        case 'decimal':
            return attributes.decimalToSchema(attribute);
        case 'dynamiczone':
            return attributes.dynamicZoneToSchema(attribute);
        case 'email':
            return attributes.emailToSchema(attribute);
        case 'enumeration':
            return attributes.enumToSchema(attribute);
        case 'float':
            return attributes.floatToSchema(attribute);
        case 'integer':
            return attributes.integerToSchema(attribute);
        case 'json':
            return attributes.jsonToSchema(attribute);
        case 'media':
            return attributes.mediaToSchema(attribute);
        case 'relation':
            return attributes.relationToSchema(attribute);
        case 'password':
        case 'text':
        case 'richtext':
        case 'string':
            return attributes.stringToSchema(attribute);
        case 'time':
            return attributes.timeToSchema(attribute);
        case 'timestamp':
            return attributes.timestampToSchema(attribute);
        case 'uid':
            return attributes.uidToSchema(attribute);
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
            return attributes.bigIntegerToInputSchema(attribute);
        case 'blocks':
            return attributes.blocksToInputSchema();
        case 'boolean':
            return attributes.booleanToInputSchema(attribute);
        case 'component':
            return attributes.componentToInputSchema(attribute);
        case 'date':
            return attributes.dateToInputSchema(attribute);
        case 'datetime':
            return attributes.datetimeToInputSchema(attribute);
        case 'decimal':
            return attributes.decimalToInputSchema(attribute);
        case 'dynamiczone':
            return attributes.dynamicZoneToInputSchema(attribute);
        case 'email':
            return attributes.emailToInputSchema(attribute);
        case 'enumeration':
            return attributes.enumerationToInputSchema(attribute);
        case 'float':
            return attributes.floatToInputSchema(attribute);
        case 'integer':
            return attributes.integerToInputSchema(attribute);
        case 'json':
            return attributes.jsonToInputSchema(attribute);
        case 'media':
            return attributes.mediaToInputSchema(attribute);
        case 'relation':
            return attributes.relationToInputSchema(attribute);
        case 'password':
        case 'text':
        case 'richtext':
        case 'string':
            return attributes.textToInputSchema(attribute);
        case 'time':
            return attributes.timeToInputSchema(attribute);
        case 'timestamp':
            return attributes.timestampToInputSchema(attribute);
        case 'uid':
            return attributes.uidToInputSchema(attribute);
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

exports.createAttributesInputSchema = createAttributesInputSchema;
exports.createAttributesSchema = createAttributesSchema;
exports.mapAttributeToInputSchema = mapAttributeToInputSchema;
exports.mapAttributeToSchema = mapAttributeToSchema;
//# sourceMappingURL=mappers.js.map
