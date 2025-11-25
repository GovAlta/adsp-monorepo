import { isArray, omit, cloneDeep } from 'lodash/fp';
import { getNonWritableAttributes, constants } from '../content-types.mjs';
import { pipe } from '../async.mjs';
import * as index from './visitors/index.mjs';
export { index as visitors };
import { defaultSanitizeFilters, defaultSanitizeSort, defaultSanitizeFields, defaultSanitizePopulate, defaultSanitizeOutput } from './sanitizers.mjs';
import * as sanitizers from './sanitizers.mjs';
export { sanitizers };
import traverseEntity from '../traverse-entity.mjs';
import traverseQueryFilters from '../traverse/query-filters.mjs';
import traverseQuerySort from '../traverse/query-sort.mjs';
import traverseQueryPopulate from '../traverse/query-populate.mjs';
import '../traverse/query-fields.mjs';
import removeRestrictedFields from './visitors/remove-restricted-fields.mjs';
import removeRestrictedRelations from './visitors/remove-restricted-relations.mjs';

const createAPISanitizers = (opts)=>{
    const { getModel } = opts;
    const sanitizeInput = (data, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeInput');
        }
        if (isArray(data)) {
            return Promise.all(data.map((entry)=>sanitizeInput(entry, schema, {
                    auth
                })));
        }
        const nonWritableAttributes = getNonWritableAttributes(schema);
        const transforms = [
            // Remove first level ID in inputs
            omit(constants.ID_ATTRIBUTE),
            omit(constants.DOC_ID_ATTRIBUTE),
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
        return pipe(...transforms)(data);
    };
    const sanitizeOutput = async (data, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeOutput');
        }
        if (isArray(data)) {
            const res = new Array(data.length);
            for(let i = 0; i < data.length; i += 1){
                res[i] = await sanitizeOutput(data[i], schema, {
                    auth
                });
            }
            return res;
        }
        const transforms = [
            (data)=>defaultSanitizeOutput({
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
        return pipe(...transforms)(data);
    };
    const sanitizeQuery = async (query, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeQuery');
        }
        const { filters, sort, fields, populate } = query;
        const sanitizedQuery = cloneDeep(query);
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
        if (isArray(filters)) {
            return Promise.all(filters.map((filter)=>sanitizeFilters(filter, schema, {
                    auth
                })));
        }
        const transforms = [
            defaultSanitizeFilters({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(traverseQueryFilters(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        return pipe(...transforms)(filters);
    };
    const sanitizeSort = (sort, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeSort');
        }
        const transforms = [
            defaultSanitizeSort({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(traverseQuerySort(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        return pipe(...transforms)(sort);
    };
    const sanitizeFields = (fields, schema)=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizeFields');
        }
        const transforms = [
            defaultSanitizeFields({
                schema,
                getModel
            })
        ];
        return pipe(...transforms)(fields);
    };
    const sanitizePopulate = (populate, schema, { auth } = {})=>{
        if (!schema) {
            throw new Error('Missing schema in sanitizePopulate');
        }
        const transforms = [
            defaultSanitizePopulate({
                schema,
                getModel
            })
        ];
        if (auth) {
            transforms.push(traverseQueryPopulate(removeRestrictedRelations(auth), {
                schema,
                getModel
            }));
        }
        return pipe(...transforms)(populate);
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

export { createAPISanitizers };
//# sourceMappingURL=index.mjs.map
