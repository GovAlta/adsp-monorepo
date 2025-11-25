'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

/**
 * Default limit values from config
 */ const getLimitConfigDefaults = ()=>({
        defaultLimit: fp.toNumber(strapi.config.get('api.rest.defaultLimit', 25)),
        maxLimit: fp.toNumber(strapi.config.get('api.rest.maxLimit')) || null
    });
const isOffsetPagination = (pagination)=>fp.has('start', pagination) || fp.has('limit', pagination);
const isPagedPagination = (pagination)=>fp.has('page', pagination) || fp.has('pageSize', pagination) || !isOffsetPagination(pagination);
const shouldCount = (params)=>{
    if (fp.has('pagination.withCount', params)) {
        const withCount = params.pagination?.withCount;
        if (typeof withCount === 'boolean') {
            return withCount;
        }
        if (typeof withCount === 'undefined') {
            return false;
        }
        if ([
            'true',
            't',
            '1',
            1
        ].includes(withCount)) {
            return true;
        }
        if ([
            'false',
            'f',
            '0',
            0
        ].includes(withCount)) {
            return false;
        }
        throw new strapiUtils.errors.ValidationError('Invalid withCount parameter. Expected "t","1","true","false","0","f"');
    }
    return Boolean(strapi.config.get('api.rest.withCount', true));
};
const getPaginationInfo = (params)=>{
    const { defaultLimit, maxLimit } = getLimitConfigDefaults();
    const { start, limit } = strapiUtils.pagination.withDefaultPagination(params.pagination || {}, {
        defaults: {
            offset: {
                limit: defaultLimit
            },
            page: {
                pageSize: defaultLimit
            }
        },
        maxLimit: maxLimit || -1
    });
    return {
        start,
        limit
    };
};
const transformPaginationResponse = (paginationInfo, total, isPaged)=>{
    const transform = isPaged ? strapiUtils.pagination.transformPagedPaginationInfo : strapiUtils.pagination.transformOffsetPaginationInfo;
    const paginationResponse = transform(paginationInfo, total);
    if (fp.isNil(total)) {
        // Ignore total and pageCount if `total` value is not available.
        return fp.omit([
            'total',
            'pageCount'
        ], paginationResponse);
    }
    return paginationResponse;
};

exports.getPaginationInfo = getPaginationInfo;
exports.isPagedPagination = isPagedPagination;
exports.shouldCount = shouldCount;
exports.transformPaginationResponse = transformPaginationResponse;
//# sourceMappingURL=pagination.js.map
