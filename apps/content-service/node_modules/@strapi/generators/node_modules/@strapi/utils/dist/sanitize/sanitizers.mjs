import { curry, isObject, isEmpty, isNil, isArray } from 'lodash/fp';
import { pipe } from '../async.mjs';
import traverseEntity from '../traverse-entity.mjs';
import { isScalarAttribute, constants } from '../content-types.mjs';
import traverseQueryFilters from '../traverse/query-filters.mjs';
import traverseQuerySort from '../traverse/query-sort.mjs';
import traverseQueryPopulate from '../traverse/query-populate.mjs';
import traverseQueryFields from '../traverse/query-fields.mjs';
import visitor$1 from './visitors/remove-password.mjs';
import visitor from './visitors/remove-private.mjs';
import visitor$2 from './visitors/remove-morph-to-relations.mjs';
import visitor$3 from './visitors/remove-dynamic-zones.mjs';
import visitor$4 from './visitors/expand-wildcard-populate.mjs';
import { isOperator } from '../operators.mjs';

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = constants;
const sanitizePasswords = (ctx)=>async (entity)=>{
        if (!ctx.schema) {
            throw new Error('Missing schema in sanitizePasswords');
        }
        return traverseEntity(visitor$1, ctx, entity);
    };
const defaultSanitizeOutput = async (ctx, entity)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeOutput');
    }
    return traverseEntity((...args)=>{
        visitor$1(...args);
        visitor(...args);
    }, ctx, entity);
};
const defaultSanitizeFilters = curry((ctx, filters)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeFilters');
    }
    return pipe(// Remove keys that are not attributes or valid operators
    traverseQueryFilters(({ key, attribute }, { remove })=>{
        const isAttribute = !!attribute;
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not checking it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (!isAttribute && !isOperator(key)) {
            remove(key);
        }
    }, ctx), // Remove dynamic zones from filters
    traverseQueryFilters(visitor$3, ctx), // Remove morpTo relations from filters
    traverseQueryFilters(visitor$2, ctx), // Remove passwords from filters
    traverseQueryFilters(visitor$1, ctx), // Remove private from filters
    traverseQueryFilters(visitor, ctx), // Remove empty objects
    traverseQueryFilters(({ key, value }, { remove })=>{
        if (isObject(value) && isEmpty(value)) {
            remove(key);
        }
    }, ctx))(filters);
});
const defaultSanitizeSort = curry((ctx, sort)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeSort');
    }
    return pipe(// Remove non attribute keys
    traverseQuerySort(({ key, attribute }, { remove })=>{
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not checking it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (!attribute) {
            remove(key);
        }
    }, ctx), // Remove dynamic zones from sort
    traverseQuerySort(visitor$3, ctx), // Remove morpTo relations from sort
    traverseQuerySort(visitor$2, ctx), // Remove private from sort
    traverseQuerySort(visitor, ctx), // Remove passwords from filters
    traverseQuerySort(visitor$1, ctx), // Remove keys for empty non-scalar values
    traverseQuerySort(({ key, attribute, value }, { remove })=>{
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not removing it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (!isScalarAttribute(attribute) && isEmpty(value)) {
            remove(key);
        }
    }, ctx))(sort);
});
const defaultSanitizeFields = curry((ctx, fields)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeFields');
    }
    return pipe(// Only keep scalar attributes
    traverseQueryFields(({ key, attribute }, { remove })=>{
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not checking it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (isNil(attribute) || !isScalarAttribute(attribute)) {
            remove(key);
        }
    }, ctx), // Remove private fields
    traverseQueryFields(visitor, ctx), // Remove password fields
    traverseQueryFields(visitor$1, ctx), // Remove nil values from fields array
    (value)=>isArray(value) ? value.filter((field)=>!isNil(field)) : value)(fields);
});
const defaultSanitizePopulate = curry((ctx, populate)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizePopulate');
    }
    return pipe(traverseQueryPopulate(visitor$4, ctx), traverseQueryPopulate(async ({ key, value, schema, attribute, getModel, path }, { set })=>{
        if (attribute) {
            return;
        }
        const parent = {
            key,
            path,
            schema,
            attribute
        };
        if (key === 'sort') {
            set(key, await defaultSanitizeSort({
                schema,
                getModel,
                parent
            }, value));
        }
        if (key === 'filters') {
            set(key, await defaultSanitizeFilters({
                schema,
                getModel,
                parent
            }, value));
        }
        if (key === 'fields') {
            set(key, await defaultSanitizeFields({
                schema,
                getModel,
                parent
            }, value));
        }
        if (key === 'populate') {
            set(key, await defaultSanitizePopulate({
                schema,
                getModel,
                parent
            }, value));
        }
    }, ctx), // Remove private fields
    traverseQueryPopulate(visitor, ctx))(populate);
});

export { defaultSanitizeFields, defaultSanitizeFilters, defaultSanitizeOutput, defaultSanitizePopulate, defaultSanitizeSort, sanitizePasswords };
//# sourceMappingURL=sanitizers.mjs.map
