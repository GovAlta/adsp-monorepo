'use strict';

var fp = require('lodash/fp');
var errors = require('./errors.js');

const STRAPI_DEFAULTS = {
    offset: {
        start: 0,
        limit: 10
    },
    page: {
        page: 1,
        pageSize: 10
    }
};
const paginationAttributes = [
    'start',
    'limit',
    'page',
    'pageSize'
];
const withMaxLimit = (limit, maxLimit = -1)=>{
    if (maxLimit === -1 || limit < maxLimit) {
        return limit;
    }
    return maxLimit;
};
// Ensure minimum page & pageSize values (page >= 1, pageSize >= 0, start >= 0, limit >= 0)
const ensureMinValues = ({ start, limit })=>({
        start: Math.max(start, 0),
        limit: limit === -1 ? limit : Math.max(limit, 1)
    });
const ensureMaxValues = (maxLimit = -1)=>({ start, limit })=>({
            start,
            limit: withMaxLimit(limit, maxLimit)
        });
// Apply maxLimit as the limit when limit is -1
const withNoLimit = (pagination, maxLimit = -1)=>({
        ...pagination,
        limit: pagination.limit === -1 ? maxLimit : pagination.limit
    });
const withDefaultPagination = (args, { defaults = {}, maxLimit = -1 } = {})=>{
    const defaultValues = fp.merge(STRAPI_DEFAULTS, defaults);
    const usePagePagination = !fp.isNil(args.page) || !fp.isNil(args.pageSize);
    const useOffsetPagination = !fp.isNil(args.start) || !fp.isNil(args.limit);
    const ensureValidValues = fp.pipe(ensureMinValues, ensureMaxValues(maxLimit));
    // If there is no pagination attribute, don't modify the payload
    if (!usePagePagination && !useOffsetPagination) {
        return fp.merge(args, ensureValidValues(defaultValues.offset));
    }
    // If there is page & offset pagination attributes, throw an error
    if (usePagePagination && useOffsetPagination) {
        throw new errors.PaginationError('Cannot use both page & offset pagination in the same query');
    }
    const pagination = {
        start: 0,
        limit: 0
    };
    // Start / Limit
    if (useOffsetPagination) {
        const { start, limit } = fp.merge(defaultValues.offset, args);
        Object.assign(pagination, {
            start,
            limit
        });
    }
    // Page / PageSize
    if (usePagePagination) {
        const { page, pageSize } = fp.merge(defaultValues.page, {
            ...args,
            pageSize: Math.max(1, args.pageSize ?? 0)
        });
        Object.assign(pagination, {
            start: (page - 1) * pageSize,
            limit: pageSize
        });
    }
    // Handle -1 limit
    Object.assign(pagination, withNoLimit(pagination, maxLimit));
    const replacePaginationAttributes = fp.pipe(// Remove pagination attributes
    fp.omit(paginationAttributes), // Merge the object with the new pagination + ensure minimum & maximum values
    fp.merge(ensureValidValues(pagination)));
    return replacePaginationAttributes(args);
};
/**
 * Transform pagination information into a paginated response:
 * {
 *    page: number,
 *    pageSize: number,
 *    pageCount: number,
 *    total: number
 * }
 */ const transformPagedPaginationInfo = (paginationInfo, total)=>{
    if (!fp.isNil(paginationInfo.page)) {
        const page = paginationInfo.page;
        const pageSize = paginationInfo.pageSize ?? total;
        return {
            page,
            pageSize,
            pageCount: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
            total
        };
    }
    if (!fp.isNil(paginationInfo.start)) {
        const start = paginationInfo.start;
        const limit = paginationInfo.limit ?? total;
        // Start limit to page page size
        return {
            page: Math.floor(start / limit) + 1,
            pageSize: limit,
            pageCount: limit > 0 ? Math.ceil(total / limit) : 0,
            total
        };
    }
    // Default pagination
    return {
        ...paginationInfo,
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total
    };
};
/**
 * Transform pagination information into a offset response:
 * {
 *    start: number,
 *    limit: number,
 *    total: number
 * }
 */ const transformOffsetPaginationInfo = (paginationInfo, total)=>{
    if (!fp.isNil(paginationInfo.page)) {
        const limit = paginationInfo.pageSize ?? total;
        const start = (paginationInfo.page - 1) * limit;
        return {
            start,
            limit,
            total
        };
    }
    if (!fp.isNil(paginationInfo.start)) {
        const start = paginationInfo.start;
        const limit = paginationInfo.limit ?? total;
        // Start limit to page page size
        return {
            start,
            limit,
            total
        };
    }
    // Default pagination
    return {
        ...paginationInfo,
        start: 0,
        limit: 10,
        total
    };
};

exports.transformOffsetPaginationInfo = transformOffsetPaginationInfo;
exports.transformPagedPaginationInfo = transformPagedPaginationInfo;
exports.withDefaultPagination = withDefaultPagination;
//# sourceMappingURL=pagination.js.map
