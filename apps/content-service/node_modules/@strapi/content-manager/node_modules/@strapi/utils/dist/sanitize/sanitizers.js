'use strict';

var fp = require('lodash/fp');
var async = require('../async.js');
var traverseEntity = require('../traverse-entity.js');
var contentTypes = require('../content-types.js');
var queryFilters = require('../traverse/query-filters.js');
var querySort = require('../traverse/query-sort.js');
var queryPopulate = require('../traverse/query-populate.js');
var queryFields = require('../traverse/query-fields.js');
var removePassword = require('./visitors/remove-password.js');
var removePrivate = require('./visitors/remove-private.js');
var removeMorphToRelations = require('./visitors/remove-morph-to-relations.js');
var removeDynamicZones = require('./visitors/remove-dynamic-zones.js');
var expandWildcardPopulate = require('./visitors/expand-wildcard-populate.js');
var operators = require('../operators.js');

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = contentTypes.constants;
const sanitizePasswords = (ctx)=>async (entity)=>{
        if (!ctx.schema) {
            throw new Error('Missing schema in sanitizePasswords');
        }
        return traverseEntity(removePassword, ctx, entity);
    };
const defaultSanitizeOutput = async (ctx, entity)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeOutput');
    }
    return traverseEntity((...args)=>{
        removePassword(...args);
        removePrivate(...args);
    }, ctx, entity);
};
const defaultSanitizeFilters = fp.curry((ctx, filters)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeFilters');
    }
    return async.pipe(// Remove keys that are not attributes or valid operators
    queryFilters(({ key, attribute }, { remove })=>{
        const isAttribute = !!attribute;
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not checking it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (!isAttribute && !operators.isOperator(key)) {
            remove(key);
        }
    }, ctx), // Remove dynamic zones from filters
    queryFilters(removeDynamicZones, ctx), // Remove morpTo relations from filters
    queryFilters(removeMorphToRelations, ctx), // Remove passwords from filters
    queryFilters(removePassword, ctx), // Remove private from filters
    queryFilters(removePrivate, ctx), // Remove empty objects
    queryFilters(({ key, value }, { remove })=>{
        if (fp.isObject(value) && fp.isEmpty(value)) {
            remove(key);
        }
    }, ctx))(filters);
});
const defaultSanitizeSort = fp.curry((ctx, sort)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeSort');
    }
    return async.pipe(// Remove non attribute keys
    querySort(({ key, attribute }, { remove })=>{
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
    querySort(removeDynamicZones, ctx), // Remove morpTo relations from sort
    querySort(removeMorphToRelations, ctx), // Remove private from sort
    querySort(removePrivate, ctx), // Remove passwords from filters
    querySort(removePassword, ctx), // Remove keys for empty non-scalar values
    querySort(({ key, attribute, value }, { remove })=>{
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not removing it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (!contentTypes.isScalarAttribute(attribute) && fp.isEmpty(value)) {
            remove(key);
        }
    }, ctx))(sort);
});
const defaultSanitizeFields = fp.curry((ctx, fields)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizeFields');
    }
    return async.pipe(// Only keep scalar attributes
    queryFields(({ key, attribute }, { remove })=>{
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not checking it
        if ([
            ID_ATTRIBUTE,
            DOC_ID_ATTRIBUTE
        ].includes(key)) {
            return;
        }
        if (fp.isNil(attribute) || !contentTypes.isScalarAttribute(attribute)) {
            remove(key);
        }
    }, ctx), // Remove private fields
    queryFields(removePrivate, ctx), // Remove password fields
    queryFields(removePassword, ctx), // Remove nil values from fields array
    (value)=>fp.isArray(value) ? value.filter((field)=>!fp.isNil(field)) : value)(fields);
});
const defaultSanitizePopulate = fp.curry((ctx, populate)=>{
    if (!ctx.schema) {
        throw new Error('Missing schema in defaultSanitizePopulate');
    }
    return async.pipe(queryPopulate(expandWildcardPopulate, ctx), queryPopulate(async ({ key, value, schema, attribute, getModel, path }, { set })=>{
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
    queryPopulate(removePrivate, ctx))(populate);
});

exports.defaultSanitizeFields = defaultSanitizeFields;
exports.defaultSanitizeFilters = defaultSanitizeFilters;
exports.defaultSanitizeOutput = defaultSanitizeOutput;
exports.defaultSanitizePopulate = defaultSanitizePopulate;
exports.defaultSanitizeSort = defaultSanitizeSort;
exports.sanitizePasswords = sanitizePasswords;
//# sourceMappingURL=sanitizers.js.map
