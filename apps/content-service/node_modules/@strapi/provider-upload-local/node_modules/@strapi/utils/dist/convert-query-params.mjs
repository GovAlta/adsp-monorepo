import ___default from 'lodash';
import { isString, toNumber, isNil, isObject, cloneDeep, isEmpty, get, isArray, isInteger } from 'lodash/fp';
import { isDynamicZoneAttribute, isMorphToRelationalAttribute, constants, hasDraftAndPublish } from './content-types.mjs';
import { PaginationError } from './errors.mjs';
import { isOperator } from './operators.mjs';
import parseType from './parse-type.mjs';

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE, PUBLISHED_AT_ATTRIBUTE } = constants;
class InvalidOrderError extends Error {
    constructor(){
        super();
        this.message = 'Invalid order. order can only be one of asc|desc|ASC|DESC';
    }
}
class InvalidSortError extends Error {
    constructor(){
        super();
        this.message = 'Invalid sort parameter. Expected a string, an array of strings, a sort object or an array of sort objects';
    }
}
function validateOrder(order) {
    if (!isString(order) || ![
        'asc',
        'desc'
    ].includes(order.toLocaleLowerCase())) {
        throw new InvalidOrderError();
    }
}
const convertCountQueryParams = (countQuery)=>{
    return parseType({
        type: 'boolean',
        value: countQuery
    });
};
const convertOrderingQueryParams = (ordering)=>{
    return ordering;
};
const isPlainObject = (value)=>___default.isPlainObject(value);
const isStringArray = (value)=>isArray(value) && value.every(isString);
const createTransformer = ({ getModel })=>{
    /**
   * Sort query parser
   */ const convertSortQueryParams = (sortQuery)=>{
        if (typeof sortQuery === 'string') {
            return convertStringSortQueryParam(sortQuery);
        }
        if (isStringArray(sortQuery)) {
            return sortQuery.flatMap((sortValue)=>convertStringSortQueryParam(sortValue));
        }
        if (Array.isArray(sortQuery)) {
            return sortQuery.map((sortValue)=>convertNestedSortQueryParam(sortValue));
        }
        if (isPlainObject(sortQuery)) {
            return convertNestedSortQueryParam(sortQuery);
        }
        throw new InvalidSortError();
    };
    const convertStringSortQueryParam = (sortQuery)=>{
        return sortQuery.split(',').map((value)=>convertSingleSortQueryParam(value));
    };
    const convertSingleSortQueryParam = (sortQuery)=>{
        if (!sortQuery) {
            return {};
        }
        if (!isString(sortQuery)) {
            throw new Error('Invalid sort query');
        }
        // split field and order param with default order to ascending
        const [field, order = 'asc'] = sortQuery.split(':');
        if (field.length === 0) {
            throw new Error('Field cannot be empty');
        }
        validateOrder(order);
        // TODO: field should be a valid path on an object model
        return ___default.set({}, field, order);
    };
    const convertNestedSortQueryParam = (sortQuery)=>{
        const transformedSort = {};
        for (const field of Object.keys(sortQuery)){
            const order = sortQuery[field];
            // this is a deep sort
            if (isPlainObject(order)) {
                transformedSort[field] = convertNestedSortQueryParam(order);
            } else if (typeof order === 'string') {
                validateOrder(order);
                transformedSort[field] = order;
            } else {
                throw Error(`Invalid sort type expected object or string got ${typeof order}`);
            }
        }
        return transformedSort;
    };
    /**
   * Start query parser
   */ const convertStartQueryParams = (startQuery)=>{
        const startAsANumber = toNumber(startQuery);
        if (!___default.isInteger(startAsANumber) || startAsANumber < 0) {
            throw new Error(`convertStartQueryParams expected a positive integer got ${startAsANumber}`);
        }
        return startAsANumber;
    };
    /**
   * Limit query parser
   */ const convertLimitQueryParams = (limitQuery)=>{
        const limitAsANumber = toNumber(limitQuery);
        if (!___default.isInteger(limitAsANumber) || limitAsANumber !== -1 && limitAsANumber < 0) {
            throw new Error(`convertLimitQueryParams expected a positive integer got ${limitAsANumber}`);
        }
        if (limitAsANumber === -1) {
            return undefined;
        }
        return limitAsANumber;
    };
    const convertPageQueryParams = (page)=>{
        const pageVal = toNumber(page);
        if (!isInteger(pageVal) || pageVal <= 0) {
            throw new PaginationError(`Invalid 'page' parameter. Expected an integer > 0, received: ${page}`);
        }
        return pageVal;
    };
    const convertPageSizeQueryParams = (pageSize, page)=>{
        const pageSizeVal = toNumber(pageSize);
        if (!isInteger(pageSizeVal) || pageSizeVal <= 0) {
            throw new PaginationError(`Invalid 'pageSize' parameter. Expected an integer > 0, received: ${page}`);
        }
        return pageSizeVal;
    };
    const validatePaginationParams = (page, pageSize, start, limit)=>{
        const isPagePagination = !isNil(page) || !isNil(pageSize);
        const isOffsetPagination = !isNil(start) || !isNil(limit);
        if (isPagePagination && isOffsetPagination) {
            throw new PaginationError('Invalid pagination attributes. The page parameters are incorrect and must be in the pagination object');
        }
    };
    class InvalidPopulateError extends Error {
        constructor(){
            super();
            this.message = 'Invalid populate parameter. Expected a string, an array of strings, a populate object';
        }
    }
    // NOTE: we could support foo.* or foo.bar.* etc later on
    const convertPopulateQueryParams = (populate, schema, depth = 0)=>{
        if (depth === 0 && populate === '*') {
            return true;
        }
        if (typeof populate === 'string') {
            return populate.split(',').map((value)=>___default.trim(value));
        }
        if (Array.isArray(populate)) {
            // map convert
            return ___default.uniq(populate.flatMap((value)=>{
                if (typeof value !== 'string') {
                    throw new InvalidPopulateError();
                }
                return value.split(',').map((value)=>___default.trim(value));
            }));
        }
        if (___default.isPlainObject(populate)) {
            return convertPopulateObject(populate, schema);
        }
        throw new InvalidPopulateError();
    };
    const hasPopulateFragmentDefined = (populate)=>{
        return typeof populate === 'object' && 'on' in populate && !isNil(populate.on);
    };
    const hasCountDefined = (populate)=>{
        return typeof populate === 'object' && 'count' in populate && typeof populate.count === 'boolean';
    };
    const convertPopulateObject = (populate, schema)=>{
        if (!schema) {
            return {};
        }
        const { attributes } = schema;
        return Object.entries(populate).reduce((acc, [key, subPopulate])=>{
            // Try converting strings to regular booleans if possible
            if (___default.isString(subPopulate)) {
                try {
                    const subPopulateAsBoolean = parseType({
                        type: 'boolean',
                        value: subPopulate
                    });
                    // Only true is accepted as a boolean populate value
                    return subPopulateAsBoolean ? {
                        ...acc,
                        [key]: true
                    } : acc;
                } catch  {
                // ignore
                }
            }
            if (___default.isBoolean(subPopulate)) {
                // Only true is accepted as a boolean populate value
                return subPopulate === true ? {
                    ...acc,
                    [key]: true
                } : acc;
            }
            const attribute = attributes[key];
            if (!attribute) {
                return acc;
            }
            // Allow adding an 'on' strategy to populate queries for morphTo relations and dynamic zones
            const isMorphLikeRelationalAttribute = isDynamicZoneAttribute(attribute) || isMorphToRelationalAttribute(attribute);
            if (isMorphLikeRelationalAttribute) {
                const hasInvalidProperties = Object.keys(subPopulate).some((key)=>![
                        'populate',
                        'on',
                        'count'
                    ].includes(key));
                if (hasInvalidProperties) {
                    throw new Error(`Invalid nested populate for ${schema.info?.singularName}.${key} (${schema.uid}). Expected a fragment ("on") or "count" but found ${JSON.stringify(subPopulate)}`);
                }
                /**
         * Validate nested population queries in the context of a polymorphic attribute (dynamic zone, morph relation).
         *
         * If 'populate' exists in subPopulate, its value should be constrained to a wildcard ('*').
         */ if ('populate' in subPopulate && subPopulate.populate !== '*') {
                    throw new Error(`Invalid nested population query detected. When using 'populate' within polymorphic structures, ` + `its value must be '*' to indicate all second level links. Specific field targeting is not supported here. ` + `Consider using the fragment API for more granular population control.`);
                }
                // TODO: Remove the possibility to have multiple properties at the same time (on/count/populate)
                const newSubPopulate = {};
                // case: { populate: '*' }
                if ('populate' in subPopulate) {
                    Object.assign(newSubPopulate, {
                        populate: true
                    });
                }
                // case: { on: { <clauses> } }
                if (hasPopulateFragmentDefined(subPopulate)) {
                    // If the fragment API is used, it applies the transformation to every
                    // sub-populate, then assign the result to the new sub-populate
                    Object.assign(newSubPopulate, {
                        on: Object.entries(subPopulate.on).reduce((acc, [type, typeSubPopulate])=>({
                                ...acc,
                                [type]: convertNestedPopulate(typeSubPopulate, getModel(type))
                            }), {})
                    });
                }
                // case: { count: true | false }
                if (hasCountDefined(subPopulate)) {
                    Object.assign(newSubPopulate, {
                        count: subPopulate.count
                    });
                }
                return {
                    ...acc,
                    [key]: newSubPopulate
                };
            }
            // Edge case when trying to use the fragment ('on') on a non-morph like attribute
            if (!isMorphLikeRelationalAttribute && hasPopulateFragmentDefined(subPopulate)) {
                throw new Error(`Using fragments is not permitted to populate "${key}" in "${schema.uid}"`);
            }
            // NOTE: Retrieve the target schema UID.
            // Only handles basic relations, medias and component since it's not possible
            // to populate with options for a dynamic zone or a polymorphic relation
            let targetSchemaUID;
            if (attribute.type === 'relation') {
                targetSchemaUID = attribute.target;
            } else if (attribute.type === 'component') {
                targetSchemaUID = attribute.component;
            } else if (attribute.type === 'media') {
                targetSchemaUID = 'plugin::upload.file';
            } else {
                return acc;
            }
            const targetSchema = getModel(targetSchemaUID);
            // ignore the sub-populate for the current key if there is no schema associated
            if (!targetSchema) {
                return acc;
            }
            const populateObject = convertNestedPopulate(subPopulate, targetSchema);
            if (!populateObject) {
                return acc;
            }
            return {
                ...acc,
                [key]: populateObject
            };
        }, {});
    };
    const convertNestedPopulate = (subPopulate, schema)=>{
        if (___default.isString(subPopulate)) {
            return parseType({
                type: 'boolean',
                value: subPopulate,
                forceCast: true
            });
        }
        if (___default.isBoolean(subPopulate)) {
            return subPopulate;
        }
        if (!isPlainObject(subPopulate)) {
            throw new Error(`Invalid nested populate. Expected '*' or an object`);
        }
        const { sort, filters, fields, populate, count, ordering, page, pageSize, start, limit } = subPopulate;
        const query = {};
        if (sort) {
            query.orderBy = convertSortQueryParams(sort);
        }
        if (filters) {
            query.where = convertFiltersQueryParams(filters, schema);
        }
        if (fields) {
            query.select = convertFieldsQueryParams(fields, schema);
        }
        if (populate) {
            query.populate = convertPopulateQueryParams(populate, schema);
        }
        if (count) {
            query.count = convertCountQueryParams(count);
        }
        if (ordering) {
            query.ordering = convertOrderingQueryParams(ordering);
        }
        validatePaginationParams(page, pageSize, start, limit);
        if (!isNil(page)) {
            query.page = convertPageQueryParams(page);
        }
        if (!isNil(pageSize)) {
            query.pageSize = convertPageSizeQueryParams(pageSize, page);
        }
        if (!isNil(start)) {
            query.offset = convertStartQueryParams(start);
        }
        if (!isNil(limit)) {
            query.limit = convertLimitQueryParams(limit);
        }
        return query;
    };
    // TODO: ensure field is valid in content types (will probably have to check strapi.contentTypes since it can be a string.path)
    const convertFieldsQueryParams = (fields, schema, depth = 0)=>{
        if (depth === 0 && fields === '*') {
            return undefined;
        }
        if (typeof fields === 'string') {
            const fieldsValues = fields.split(',').map((value)=>___default.trim(value));
            // NOTE: Only include the doc id if it's a content type
            if (schema?.modelType === 'contentType') {
                return ___default.uniq([
                    ID_ATTRIBUTE,
                    DOC_ID_ATTRIBUTE,
                    ...fieldsValues
                ]);
            }
            return ___default.uniq([
                ID_ATTRIBUTE,
                ...fieldsValues
            ]);
        }
        if (isStringArray(fields)) {
            // map convert
            const fieldsValues = fields.flatMap((value)=>convertFieldsQueryParams(value, schema, depth + 1)).filter((v)=>!isNil(v));
            // NOTE: Only include the doc id if it's a content type
            if (schema?.modelType === 'contentType') {
                return ___default.uniq([
                    ID_ATTRIBUTE,
                    DOC_ID_ATTRIBUTE,
                    ...fieldsValues
                ]);
            }
            return ___default.uniq([
                ID_ATTRIBUTE,
                ...fieldsValues
            ]);
        }
        throw new Error('Invalid fields parameter. Expected a string or an array of strings');
    };
    const isValidSchemaAttribute = (key, schema)=>{
        if ([
            DOC_ID_ATTRIBUTE,
            ID_ATTRIBUTE
        ].includes(key)) {
            return true;
        }
        if (!schema) {
            return false;
        }
        return Object.keys(schema.attributes).includes(key);
    };
    const convertFiltersQueryParams = (filters, schema)=>{
        // Filters need to be either an array or an object
        // Here we're only checking for 'object' type since typeof [] => object and typeof {} => object
        if (!isObject(filters)) {
            throw new Error('The filters parameter must be an object or an array');
        }
        // Don't mutate the original object
        const filtersCopy = cloneDeep(filters);
        return convertAndSanitizeFilters(filtersCopy, schema);
    };
    const convertAndSanitizeFilters = (filters, schema)=>{
        if (Array.isArray(filters)) {
            return filters// Sanitize each filter
            .map((filter)=>convertAndSanitizeFilters(filter, schema))// Filter out empty filters
            .filter((filter)=>!isPlainObject(filter) || !isEmpty(filter));
        }
        if (!isPlainObject(filters)) {
            return filters;
        }
        const removeOperator = (operator)=>delete filters[operator];
        // Here, `key` can either be an operator or an attribute name
        for (const [key, value] of Object.entries(filters)){
            const attribute = get(key, schema?.attributes);
            const validKey = isOperator(key) || isValidSchemaAttribute(key, schema);
            if (!validKey) {
                removeOperator(key);
            } else if (attribute) {
                // Relations
                if (attribute.type === 'relation') {
                    filters[key] = convertAndSanitizeFilters(value, getModel(attribute.target));
                } else if (attribute.type === 'component') {
                    filters[key] = convertAndSanitizeFilters(value, getModel(attribute.component));
                } else if (attribute.type === 'media') {
                    filters[key] = convertAndSanitizeFilters(value, getModel('plugin::upload.file'));
                } else if (attribute.type === 'dynamiczone') {
                    removeOperator(key);
                } else if (attribute.type === 'password') {
                    // Always remove password attributes from filters object
                    removeOperator(key);
                } else {
                    filters[key] = convertAndSanitizeFilters(value, schema);
                }
            } else if ([
                '$null',
                '$notNull'
            ].includes(key)) {
                filters[key] = parseType({
                    type: 'boolean',
                    value: filters[key],
                    forceCast: true
                });
            } else if (isObject(value)) {
                filters[key] = convertAndSanitizeFilters(value, schema);
            }
            // Remove empty objects & arrays
            if (isPlainObject(filters[key]) && isEmpty(filters[key])) {
                removeOperator(key);
            }
        }
        return filters;
    };
    const convertStatusParams = (status, query = {})=>{
        // NOTE: this is the query layer filters not the document/entity service filters
        query.filters = ({ meta })=>{
            const contentType = getModel(meta.uid);
            // Ignore if target model has disabled DP, as it doesn't make sense to filter by its status
            if (!contentType || !hasDraftAndPublish(contentType)) {
                return {};
            }
            return {
                [PUBLISHED_AT_ATTRIBUTE]: {
                    $null: status === 'draft'
                }
            };
        };
    };
    const transformQueryParams = (uid, params)=>{
        // NOTE: can be a CT, a Compo or nothing in the case of polymorphism (DZ & morph relations)
        const schema = getModel(uid);
        const query = {};
        const { _q, sort, filters, fields, populate, page, pageSize, start, limit, status, ...rest } = params;
        if (!isNil(status)) {
            convertStatusParams(status, query);
        }
        if (!isNil(_q)) {
            query._q = _q;
        }
        if (!isNil(sort)) {
            query.orderBy = convertSortQueryParams(sort);
        }
        if (!isNil(filters)) {
            query.where = convertFiltersQueryParams(filters, schema);
        }
        if (!isNil(fields)) {
            query.select = convertFieldsQueryParams(fields, schema);
        }
        if (!isNil(populate)) {
            query.populate = convertPopulateQueryParams(populate, schema);
        }
        validatePaginationParams(page, pageSize, start, limit);
        if (!isNil(page)) {
            query.page = convertPageQueryParams(page);
        }
        if (!isNil(pageSize)) {
            query.pageSize = convertPageSizeQueryParams(pageSize, page);
        }
        if (!isNil(start)) {
            query.offset = convertStartQueryParams(start);
        }
        if (!isNil(limit)) {
            query.limit = convertLimitQueryParams(limit);
        }
        return {
            ...rest,
            ...query
        };
    };
    return {
        private_convertSortQueryParams: convertSortQueryParams,
        private_convertStartQueryParams: convertStartQueryParams,
        private_convertLimitQueryParams: convertLimitQueryParams,
        private_convertPopulateQueryParams: convertPopulateQueryParams,
        private_convertFiltersQueryParams: convertFiltersQueryParams,
        private_convertFieldsQueryParams: convertFieldsQueryParams,
        transformQueryParams
    };
};

export { createTransformer };
//# sourceMappingURL=convert-query-params.mjs.map
