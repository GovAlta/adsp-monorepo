'use strict';

var fp = require('lodash/fp');
var contentTypes = require('../content-types.js');
var async = require('../async.js');
var utils = require('./utils.js');
var index = require('./visitors/index.js');
var validators = require('./validators.js');
var traverseEntity = require('../traverse-entity.js');
var queryFilters = require('../traverse/query-filters.js');
var querySort = require('../traverse/query-sort.js');
var queryPopulate = require('../traverse/query-populate.js');
require('../traverse/query-fields.js');
var errors = require('../errors.js');
var throwUnrecognizedFields = require('./visitors/throw-unrecognized-fields.js');
var throwRestrictedFields = require('./visitors/throw-restricted-fields.js');
var throwRestrictedRelations = require('./visitors/throw-restricted-relations.js');

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = contentTypes.constants;
const createAPIValidators = (opts)=>{
    const { getModel } = opts || {};
    const validateInput = async (data, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in validateInput');
        }
        if (fp.isArray(data)) {
            await Promise.all(data.map((entry)=>validateInput(entry, schema, {
                    auth
                })));
            return;
        }
        const nonWritableAttributes = contentTypes.getNonWritableAttributes(schema);
        const transforms = [
            (data)=>{
                if (fp.isObject(data)) {
                    if (ID_ATTRIBUTE in data) {
                        utils.throwInvalidKey({
                            key: ID_ATTRIBUTE
                        });
                    }
                    if (DOC_ID_ATTRIBUTE in data) {
                        utils.throwInvalidKey({
                            key: DOC_ID_ATTRIBUTE
                        });
                    }
                }
                return data;
            },
            // non-writable attributes
            traverseEntity(throwRestrictedFields(nonWritableAttributes), {
                schema,
                getModel
            }),
            // unrecognized attributes
            traverseEntity(throwUnrecognizedFields, {
                schema,
                getModel
            })
        ];
        if (auth) {
            // restricted relations
            transforms.push(traverseEntity(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        // Apply validators from registry if exists
        opts?.validators?.input?.forEach((validator)=>transforms.push(validator(schema)));
        try {
            await async.pipe(...transforms)(data);
        } catch (e) {
            if (e instanceof errors.ValidationError) {
                e.details.source = 'body';
            }
            throw e;
        }
    };
    const validateQuery = async (query, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in validateQuery');
        }
        const { filters, sort, fields, populate } = query;
        if (filters) {
            await validateFilters(filters, schema, {
                auth
            });
        }
        if (sort) {
            await validateSort(sort, schema, {
                auth
            });
        }
        if (fields) {
            await validateFields(fields, schema);
        }
        // a wildcard is always valid; its conversion will be handled by the entity service and can be optimized with sanitizer
        if (populate && populate !== '*') {
            await validatePopulate(populate, schema);
        }
    };
    const validateFilters = async (filters, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in validateFilters');
        }
        if (fp.isArray(filters)) {
            await Promise.all(filters.map((filter)=>validateFilters(filter, schema, {
                    auth
                })));
            return;
        }
        const transforms = [
            validators.defaultValidateFilters({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(queryFilters(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        try {
            await async.pipe(...transforms)(filters);
        } catch (e) {
            if (e instanceof errors.ValidationError) {
                e.details.source = 'query';
                e.details.param = 'filters';
            }
            throw e;
        }
    };
    const validateSort = async (sort, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in validateSort');
        }
        const transforms = [
            validators.defaultValidateSort({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(querySort(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        try {
            await async.pipe(...transforms)(sort);
        } catch (e) {
            if (e instanceof errors.ValidationError) {
                e.details.source = 'query';
                e.details.param = 'sort';
            }
            throw e;
        }
    };
    const validateFields = async (fields, schema)=>{
        if (!schema) {
            throw new Error('Missing schema in validateFields');
        }
        const transforms = [
            validators.defaultValidateFields({
                schema,
                getModel
            })
        ];
        try {
            await async.pipe(...transforms)(fields);
        } catch (e) {
            if (e instanceof errors.ValidationError) {
                e.details.source = 'query';
                e.details.param = 'fields';
            }
            throw e;
        }
    };
    const validatePopulate = async (populate, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizePopulate');
        }
        const transforms = [
            validators.defaultValidatePopulate({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(queryPopulate(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        try {
            await async.pipe(...transforms)(populate);
        } catch (e) {
            if (e instanceof errors.ValidationError) {
                e.details.source = 'query';
                e.details.param = 'populate';
            }
            throw e;
        }
    };
    return {
        input: validateInput,
        query: validateQuery,
        filters: validateFilters,
        sort: validateSort,
        fields: validateFields,
        populate: validatePopulate
    };
};

exports.visitors = index;
exports.validators = validators;
exports.createAPIValidators = createAPIValidators;
//# sourceMappingURL=index.js.map
