import { isArray, isObject } from 'lodash/fp';
import { getNonWritableAttributes, constants } from '../content-types.mjs';
import { pipe } from '../async.mjs';
import { throwInvalidKey } from './utils.mjs';
import * as index from './visitors/index.mjs';
export { index as visitors };
import { defaultValidateFilters, defaultValidateSort, defaultValidateFields, defaultValidatePopulate } from './validators.mjs';
import * as validators from './validators.mjs';
export { validators };
import traverseEntity from '../traverse-entity.mjs';
import traverseQueryFilters from '../traverse/query-filters.mjs';
import traverseQuerySort from '../traverse/query-sort.mjs';
import traverseQueryPopulate from '../traverse/query-populate.mjs';
import '../traverse/query-fields.mjs';
import { ValidationError } from '../errors.mjs';
import throwUnrecognizedFields from './visitors/throw-unrecognized-fields.mjs';
import throwRestrictedFields from './visitors/throw-restricted-fields.mjs';
import throwRestrictedRelations from './visitors/throw-restricted-relations.mjs';

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = constants;
const createAPIValidators = (opts)=>{
    const { getModel } = opts || {};
    const validateInput = async (data, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in validateInput');
        }
        if (isArray(data)) {
            await Promise.all(data.map((entry)=>validateInput(entry, schema, {
                    auth
                })));
            return;
        }
        const nonWritableAttributes = getNonWritableAttributes(schema);
        const transforms = [
            (data)=>{
                if (isObject(data)) {
                    if (ID_ATTRIBUTE in data) {
                        throwInvalidKey({
                            key: ID_ATTRIBUTE
                        });
                    }
                    if (DOC_ID_ATTRIBUTE in data) {
                        throwInvalidKey({
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
            await pipe(...transforms)(data);
        } catch (e) {
            if (e instanceof ValidationError) {
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
        if (isArray(filters)) {
            await Promise.all(filters.map((filter)=>validateFilters(filter, schema, {
                    auth
                })));
            return;
        }
        const transforms = [
            defaultValidateFilters({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(traverseQueryFilters(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        try {
            await pipe(...transforms)(filters);
        } catch (e) {
            if (e instanceof ValidationError) {
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
            defaultValidateSort({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(traverseQuerySort(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        try {
            await pipe(...transforms)(sort);
        } catch (e) {
            if (e instanceof ValidationError) {
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
            defaultValidateFields({
                schema,
                getModel
            })
        ];
        try {
            await pipe(...transforms)(fields);
        } catch (e) {
            if (e instanceof ValidationError) {
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
            defaultValidatePopulate({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(traverseQueryPopulate(throwRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        try {
            await pipe(...transforms)(populate);
        } catch (e) {
            if (e instanceof ValidationError) {
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

export { createAPIValidators };
//# sourceMappingURL=index.mjs.map
