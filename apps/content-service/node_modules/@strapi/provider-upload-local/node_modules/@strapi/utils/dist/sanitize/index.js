'use strict';

var fp = require('lodash/fp');
var contentTypes = require('../content-types.js');
var async = require('../async.js');
var index = require('./visitors/index.js');
var sanitizers = require('./sanitizers.js');
var traverseEntity = require('../traverse-entity.js');
var queryFilters = require('../traverse/query-filters.js');
var querySort = require('../traverse/query-sort.js');
var queryPopulate = require('../traverse/query-populate.js');
require('../traverse/query-fields.js');
var removeRestrictedFields = require('./visitors/remove-restricted-fields.js');
var removeRestrictedRelations = require('./visitors/remove-restricted-relations.js');

const createAPISanitizers = (opts)=>{
    const { getModel } = opts;
    const sanitizeInput = (data, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeInput');
        }
        if (fp.isArray(data)) {
            return Promise.all(data.map((entry)=>sanitizeInput(entry, schema, {
                    auth
                })));
        }
        const nonWritableAttributes = contentTypes.getNonWritableAttributes(schema);
        const transforms = [
            // Remove first level ID in inputs
            fp.omit(contentTypes.constants.ID_ATTRIBUTE),
            fp.omit(contentTypes.constants.DOC_ID_ATTRIBUTE),
            // Remove non-writable attributes
            traverseEntity(removeRestrictedFields(nonWritableAttributes), {
                schema,
                getModel
            })
        ];
        if (auth) {
            // Remove restricted relations
            transforms.push(traverseEntity(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        // Apply sanitizers from registry if exists
        opts?.sanitizers?.input?.forEach((sanitizer)=>transforms.push(sanitizer(schema)));
        return async.pipe(...transforms)(data);
    };
    const sanitizeOutput = async (data, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeOutput');
        }
        if (fp.isArray(data)) {
            const res = new Array(data.length);
            for(let i = 0; i < data.length; i += 1){
                res[i] = await sanitizeOutput(data[i], schema, {
                    auth
                });
            }
            return res;
        }
        const transforms = [
            (data)=>sanitizers.defaultSanitizeOutput({
                    schema,
                    getModel
                }, data)
        ];
        if (auth) {
            transforms.push(traverseEntity(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        // Apply sanitizers from registry if exists
        opts?.sanitizers?.output?.forEach((sanitizer)=>transforms.push(sanitizer(schema)));
        return async.pipe(...transforms)(data);
    };
    const sanitizeQuery = async (query, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeQuery');
        }
        const { filters, sort, fields, populate } = query;
        const sanitizedQuery = fp.cloneDeep(query);
        if (filters) {
            Object.assign(sanitizedQuery, {
                filters: await sanitizeFilters(filters, schema, {
                    auth
                })
            });
        }
        if (sort) {
            Object.assign(sanitizedQuery, {
                sort: await sanitizeSort(sort, schema, {
                    auth
                })
            });
        }
        if (fields) {
            Object.assign(sanitizedQuery, {
                fields: await sanitizeFields(fields, schema)
            });
        }
        if (populate) {
            Object.assign(sanitizedQuery, {
                populate: await sanitizePopulate(populate, schema)
            });
        }
        return sanitizedQuery;
    };
    const sanitizeFilters = (filters, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeFilters');
        }
        if (fp.isArray(filters)) {
            return Promise.all(filters.map((filter)=>sanitizeFilters(filter, schema, {
                    auth
                })));
        }
        const transforms = [
            sanitizers.defaultSanitizeFilters({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(queryFilters(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        return async.pipe(...transforms)(filters);
    };
    const sanitizeSort = (sort, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeSort');
        }
        const transforms = [
            sanitizers.defaultSanitizeSort({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(querySort(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        return async.pipe(...transforms)(sort);
    };
    const sanitizeFields = (fields, schema)=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeFields');
        }
        const transforms = [
            sanitizers.defaultSanitizeFields({
                schema,
                getModel
            })
        ];
        return async.pipe(...transforms)(fields);
    };
    const sanitizePopulate = (populate, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizePopulate');
        }
        const transforms = [
            sanitizers.defaultSanitizePopulate({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(queryPopulate(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        return async.pipe(...transforms)(populate);
    };
    return {
        input: sanitizeInput,
        output: sanitizeOutput,
        query: sanitizeQuery,
        filters: sanitizeFilters,
        sort: sanitizeSort,
        fields: sanitizeFields,
        populate: sanitizePopulate
    };
};

exports.visitors = index;
exports.sanitizers = sanitizers;
exports.createAPISanitizers = createAPISanitizers;
//# sourceMappingURL=index.js.map
