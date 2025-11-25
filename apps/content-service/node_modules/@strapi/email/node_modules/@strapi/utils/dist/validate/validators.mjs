import { isEmpty, isNil, isObject } from 'lodash/fp';
import { pipe } from '../async.mjs';
import { isScalarAttribute, constants } from '../content-types.mjs';
import traverseQueryFilters from '../traverse/query-filters.mjs';
import traverseQuerySort from '../traverse/query-sort.mjs';
import traverseQueryPopulate from '../traverse/query-populate.mjs';
import traverseQueryFields from '../traverse/query-fields.mjs';
import visitor$2 from './visitors/throw-password.mjs';
import visitor$3 from './visitors/throw-private.mjs';
import { asyncCurry, throwInvalidKey } from './utils.mjs';
import visitor$1 from './visitors/throw-morph-to-relations.mjs';
import visitor from './visitors/throw-dynamic-zones.mjs';
import './visitors/throw-unrecognized-fields.mjs';
import { isOperator } from '../operators.mjs';
import parseType from '../parse-type.mjs';

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = constants;
const FILTER_TRAVERSALS = [
    'nonAttributesOperators',
    'dynamicZones',
    'morphRelations',
    'passwords',
    'private'
];
const validateFilters = asyncCurry(async (ctx, filters, include)=>{
    // TODO: schema checks should check that it is a valid schema with yup
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidateFilters');
    }
    // Build the list of functions conditionally
    const functionsToApply = [];
    // keys that are not attributes or valid operators
    if (include.includes('nonAttributesOperators')) {
        functionsToApply.push(traverseQueryFilters(({ key, attribute, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not removing it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            const isAttribute = !!attribute;
            if (!isAttribute && !isOperator(key)) {
                throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    if (include.includes('dynamicZones')) {
        functionsToApply.push(traverseQueryFilters(visitor, ctx));
    }
    if (include.includes('morphRelations')) {
        functionsToApply.push(traverseQueryFilters(visitor$1, ctx));
    }
    if (include.includes('passwords')) {
        functionsToApply.push(traverseQueryFilters(visitor$2, ctx));
    }
    if (include.includes('private')) {
        functionsToApply.push(traverseQueryFilters(visitor$3, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return filters;
    }
    return pipe(...functionsToApply)(filters);
});
const defaultValidateFilters = asyncCurry(async (ctx, filters)=>{
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
const validateSort = asyncCurry(async (ctx, sort, include)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidateSort');
    }
    // Build the list of functions conditionally based on the include array
    const functionsToApply = [];
    // Validate non attribute keys
    if (include.includes('nonAttributesOperators')) {
        functionsToApply.push(traverseQuerySort(({ key, attribute, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not removing it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            if (!attribute) {
                throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    // Validate dynamic zones from sort
    if (include.includes('dynamicZones')) {
        functionsToApply.push(traverseQuerySort(visitor, ctx));
    }
    // Validate morphTo relations from sort
    if (include.includes('morphRelations')) {
        functionsToApply.push(traverseQuerySort(visitor$1, ctx));
    }
    // Validate passwords from sort
    if (include.includes('passwords')) {
        functionsToApply.push(traverseQuerySort(visitor$2, ctx));
    }
    // Validate private from sort
    if (include.includes('private')) {
        functionsToApply.push(traverseQuerySort(visitor$3, ctx));
    }
    // Validate non-scalar empty keys
    if (include.includes('nonScalarEmptyKeys')) {
        functionsToApply.push(traverseQuerySort(({ key, attribute, value, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not removing it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            if (!isScalarAttribute(attribute) && isEmpty(value)) {
                throwInvalidKey({
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
    return pipe(...functionsToApply)(sort);
});
const defaultValidateSort = asyncCurry(async (ctx, sort)=>{
    return validateSort(ctx, sort, SORT_TRAVERSALS);
});
const FIELDS_TRAVERSALS = [
    'scalarAttributes',
    'privateFields',
    'passwordFields'
];
const validateFields = asyncCurry(async (ctx, fields, include)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidateFields');
    }
    // Build the list of functions conditionally based on the include array
    const functionsToApply = [];
    // Only allow scalar attributes
    if (include.includes('scalarAttributes')) {
        functionsToApply.push(traverseQueryFields(({ key, attribute, path })=>{
            // ID is not an attribute per se, so we need to make
            // an extra check to ensure we're not throwing because of it
            if ([
                ID_ATTRIBUTE,
                DOC_ID_ATTRIBUTE
            ].includes(key)) {
                return;
            }
            if (isNil(attribute) || !isScalarAttribute(attribute)) {
                throwInvalidKey({
                    key,
                    path: path.attribute
                });
            }
        }, ctx));
    }
    // Private fields
    if (include.includes('privateFields')) {
        functionsToApply.push(traverseQueryFields(visitor$3, ctx));
    }
    // Password fields
    if (include.includes('passwordFields')) {
        functionsToApply.push(traverseQueryFields(visitor$2, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return fields;
    }
    return pipe(...functionsToApply)(fields);
});
const defaultValidateFields = asyncCurry(async (ctx, fields)=>{
    return validateFields(ctx, fields, FIELDS_TRAVERSALS);
});
const POPULATE_TRAVERSALS = [
    'nonAttributesOperators',
    'private'
];
const validatePopulate = asyncCurry(async (ctx, populate, includes)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultValidatePopulate');
    }
    // Build the list of functions conditionally based on the include array
    const functionsToApply = [];
    // Always include the main traversal function
    functionsToApply.push(traverseQueryPopulate(async ({ key, path, value, schema, attribute, getModel, parent }, { set })=>{
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
                throwInvalidKey({
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
            if (!isObject(value)) {
                return throwInvalidKey({
                    key,
                    path: path.raw
                });
            }
            const targets = Object.keys(value);
            for (const target of targets){
                const model = getModel(target);
                // If a target is invalid (no matching model), then raise an error
                if (!model) {
                    throwInvalidKey({
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
                throwInvalidKey({
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
            throwInvalidKey({
                key,
                path: path.attribute
            });
        }
    }, ctx));
    // Conditionally traverse for private fields only if 'private' is included
    if (includes?.populate?.includes('private')) {
        functionsToApply.push(traverseQueryPopulate(visitor$3, ctx));
    }
    // Return directly if no validation functions are provided
    if (functionsToApply.length === 0) {
        return populate;
    }
    return pipe(...functionsToApply)(populate);
});
const defaultValidatePopulate = asyncCurry(async (ctx, populate)=>{
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

export { FIELDS_TRAVERSALS, FILTER_TRAVERSALS, POPULATE_TRAVERSALS, SORT_TRAVERSALS, defaultValidateFields, defaultValidateFilters, defaultValidatePopulate, defaultValidateSort, validateFields, validateFilters, validatePopulate, validateSort };
//# sourceMappingURL=validators.mjs.map
