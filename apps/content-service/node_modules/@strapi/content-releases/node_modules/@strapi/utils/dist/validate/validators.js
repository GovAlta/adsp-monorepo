'use strict';

var fp = require('lodash/fp');
var async = require('../async.js');
var contentTypes = require('../content-types.js');
var queryFilters = require('../traverse/query-filters.js');
var querySort = require('../traverse/query-sort.js');
var queryPopulate = require('../traverse/query-populate.js');
var queryFields = require('../traverse/query-fields.js');
var throwPassword = require('./visitors/throw-password.js');
var throwPrivate = require('./visitors/throw-private.js');
var utils = require('./utils.js');
var throwMorphToRelations = require('./visitors/throw-morph-to-relations.js');
var throwDynamicZones = require('./visitors/throw-dynamic-zones.js');
require('./visitors/throw-unrecognized-fields.js');
var operators = require('../operators.js');
var parseType = require('../parse-type.js');

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = contentTypes.constants;
const FILTER_TRAVERSALS = [
    'nonAttributesOperators',
    'dynamicZones',
    'morphRelations',
    'passwords',
    'private'
];
const validateFilters = utils.asyncCurry(async (ctx, filters, include)=>{
    // TODO: schema checks should check that it is a valid schema with yup
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidateFilters');
    }
    // Build the list of functions conditionally
    const functionsToApply = [];
    // keys that are not attributes or valid operators
    if (include.includes('nonAttributesOperators')) {
        functionsToApply.push(queryFilters(({ key, attribute, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not removing it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            const isAttribute = !!attribute;
            if (!isAttribute && !operators.isOperator(key)) {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    if (include.includes('dynamicZones')) {
        functionsToApply.push(queryFilters(throwDynamicZones, ctx));
    }
    if (include.includes('morphRelations')) {
        functionsToApply.push(queryFilters(throwMorphToRelations, ctx));
    }
    if (include.includes('passwords')) {
        functionsToApply.push(queryFilters(throwPassword, ctx));
    }
    if (include.includes('private')) {
        functionsToApply.push(queryFilters(throwPrivate, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return filters;
    }
    return async.pipe(...functionsToApply)(filters);
});
const defaultValidateFilters = utils.asyncCurry(async (ctx, filters)=>{
    return validateFilters(ctx, filters, FILTER_TRAVERSALS);
});
const SORT_TRAVERSALS = [
    'nonAttributesOperators',
    'dynamicZones',
    'morphRelations',
    'passwords',
    'private',
    'nonScalarEmptyKeys'
];
const validateSort = utils.asyncCurry(async (ctx, sort, include)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidateSort');
    }
    // Build the list of functions conditionally based on the include array
    const functionsToApply = [];
    // Validate non attribute keys
    if (include.includes('nonAttributesOperators')) {
        functionsToApply.push(querySort(({ key, attribute, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not removing it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            if (!attribute) {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    // Validate dynamic zones from sort
    if (include.includes('dynamicZones')) {
        functionsToApply.push(querySort(throwDynamicZones, ctx));
    }
    // Validate morphTo relations from sort
    if (include.includes('morphRelations')) {
        functionsToApply.push(querySort(throwMorphToRelations, ctx));
    }
    // Validate passwords from sort
    if (include.includes('passwords')) {
        functionsToApply.push(querySort(throwPassword, ctx));
    }
    // Validate private from sort
    if (include.includes('private')) {
        functionsToApply.push(querySort(throwPrivate, ctx));
    }
    // Validate non-scalar empty keys
    if (include.includes('nonScalarEmptyKeys')) {
        functionsToApply.push(querySort(({ key, attribute, value, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not removing it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            if (!contentTypes.isScalarAttribute(attribute) && fp.isEmpty(value)) {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return sort;
    }
    return async.pipe(...functionsToApply)(sort);
});
const defaultValidateSort = utils.asyncCurry(async (ctx, sort)=>{
    return validateSort(ctx, sort, SORT_TRAVERSALS);
});
const FIELDS_TRAVERSALS = [
    'scalarAttributes',
    'privateFields',
    'passwordFields'
];
const validateFields = utils.asyncCurry(async (ctx, fields, include)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidateFields');
    }
    // Build the list of functions conditionally based on the include array
    const functionsToApply = [];
    // Only allow scalar attributes
    if (include.includes('scalarAttributes')) {
        functionsToApply.push(queryFields(({ key, attribute, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not throwing because of it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            if (fp.isNil(attribute) || !contentTypes.isScalarAttribute(attribute)) {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    // Private fields
    if (include.includes('privateFields')) {
        functionsToApply.push(queryFields(throwPrivate, ctx));
    }
    // Password fields
    if (include.includes('passwordFields')) {
        functionsToApply.push(queryFields(throwPassword, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return fields;
    }
    return async.pipe(...functionsToApply)(fields);
});
const defaultValidateFields = utils.asyncCurry(async (ctx, fields)=>{
    return validateFields(ctx, fields, FIELDS_TRAVERSALS);
});
const POPULATE_TRAVERSALS = [
    'nonAttributesOperators',
    'private'
];
const validatePopulate = utils.asyncCurry(async (ctx, populate, includes)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidatePopulate');
    }
    // Build the list of functions conditionally based on the include array
    const functionsToApply = [];
    // Always include the main traversal function
    functionsToApply.push(queryPopulate(async ({ key, path, value, schema, attribute, getModel, parent }, { set })=>{
        /**
           * NOTE: The parent check is done to support "filters" (and the rest of keys) as valid attribute names.
           *
           * The parent will not be an attribute when its a "populate" / "filters" / "sort" ... key.
           * Only in those scenarios the node will be an attribute.
           */ if (!parent?.attribute && attribute) {
            const isPopulatableAttribute = [
                'relation',
                'dynamiczone',
                'component',
                'media'
            ].includes(attribute.type);
            // Throw on non-populate attributes
            if (!isPopulatableAttribute) {
                utils.throwInvalidKey({
                    key,
                    path: path.raw
                });
            }
            // Valid populatable attribute, so return
            return;
        }
        // If we're looking at a populate fragment, ensure its target is valid
        if (key === 'on') {
            // Populate fragment should always be an object
            if (!fp.isObject(value)) {
                return utils.throwInvalidKey({
                    key,
                    path: path.raw
                });
            }
            const targets = Object.keys(value);
            for (const target of targets){
                const model = getModel(target);
                // If a target is invalid (no matching model), then raise an error
                if (!model) {
                    utils.throwInvalidKey({
                        key: target,
                        path: `${path.raw}.${target}`
                    });
                }
            }
            // If the fragment's target is fine, then let it pass
            return;
        }
        // Ignore plain wildcards
        if (key === '' && value === '*') {
            return;
        }
        // Ensure count is a boolean
        if (key === 'count') {
            try {
                parseType({
                    type: 'boolean',
                    value
                });
                return;
            } catch  {
                utils.throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }
        // Allowed boolean-like keywords should be ignored
        try {
            parseType({
                type: 'boolean',
                value: key
            });
            // Key is an allowed boolean-like keyword, skipping validation...
            return;
        } catch  {
        // Continue, because it's not a boolean-like
        }
        // Handle nested `sort` validation with custom or default traversals
        if (key === 'sort') {
            set(key, await validateSort({
                schema,
                getModel
            }, value, includes?.sort || SORT_TRAVERSALS));
            return;
        }
        // Handle nested `filters` validation with custom or default traversals
        if (key === 'filters') {
            set(key, await validateFilters({
                schema,
                getModel
            }, value, includes?.filters || FILTER_TRAVERSALS));
            return;
        }
        // Handle nested `fields` validation with custom or default traversals
        if (key === 'fields') {
            set(key, await validateFields({
                schema,
                getModel
            }, value, includes?.fields || FIELDS_TRAVERSALS));
            return;
        }
        // Handle recursive nested `populate` validation with the same include object
        if (key === 'populate') {
            set(key, await validatePopulate({
                schema,
                getModel,
                parent: {
                    key,
                    path,
                    schema,
                    attribute
                },
                path
            }, value, includes // pass down the same includes object
            ));
            return;
        }
        // Throw an error if non-attribute operators are included in the populate array
        if (includes?.populate?.includes('nonAttributesOperators')) {
            utils.throwInvalidKey({
                key,
                path: path.attribute
            });
        }
    }, ctx));
    // Conditionally traverse for private fields only if 'private' is included
    if (includes?.populate?.includes('private')) {
        functionsToApply.push(queryPopulate(throwPrivate, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return populate;
    }
    return async.pipe(...functionsToApply)(populate);
});
const defaultValidatePopulate = utils.asyncCurry(async (ctx, populate)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidatePopulate');
    }
    // Call validatePopulate and include all validations by passing in full traversal arrays
    return validatePopulate(ctx, populate, {
        filters: FILTER_TRAVERSALS,
        sort: SORT_TRAVERSALS,
        fields: FIELDS_TRAVERSALS,
        populate: POPULATE_TRAVERSALS
    });
});

exports.FIELDS_TRAVERSALS = FIELDS_TRAVERSALS;
exports.FILTER_TRAVERSALS = FILTER_TRAVERSALS;
exports.POPULATE_TRAVERSALS = POPULATE_TRAVERSALS;
exports.SORT_TRAVERSALS = SORT_TRAVERSALS;
exports.defaultValidateFields = defaultValidateFields;
exports.defaultValidateFilters = defaultValidateFilters;
exports.defaultValidatePopulate = defaultValidatePopulate;
exports.defaultValidateSort = defaultValidateSort;
exports.validateFields = validateFields;
exports.validateFilters = validateFilters;
exports.validatePopulate = validatePopulate;
exports.validateSort = validateSort;
//# sourceMappingURL=validators.js.map
