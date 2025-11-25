'use strict';

/**
 * @description
 * Creates a valid query params object for get requests
 * ie. plugins[i18n][locale]=en becomes locale=en
 */ const buildValidParams = (query)=>{
    if (!query) return query;
    // Extract pluginOptions from the query, they shouldn't be part of the URL
    const { plugins: _, ...validQueryParams } = {
        ...query,
        ...Object.values(query?.plugins ?? {}).reduce((acc, current)=>Object.assign(acc, current), {})
    };
    return validQueryParams;
};
const isBaseQueryError = (error)=>{
    return error.name !== undefined;
};

exports.buildValidParams = buildValidParams;
exports.isBaseQueryError = isBaseQueryError;
//# sourceMappingURL=api.js.map
