'use strict';

var createError = require('http-errors');
var strapiUtils = require('@strapi/utils');

const mapErrorsAndStatus = [
    {
        classError: strapiUtils.errors.UnauthorizedError,
        status: 401
    },
    {
        classError: strapiUtils.errors.ForbiddenError,
        status: 403
    },
    {
        classError: strapiUtils.errors.NotFoundError,
        status: 404
    },
    {
        classError: strapiUtils.errors.PayloadTooLargeError,
        status: 413
    },
    {
        classError: strapiUtils.errors.RateLimitError,
        status: 429
    },
    {
        classError: strapiUtils.errors.NotImplementedError,
        status: 501
    }
];
const formatApplicationError = (error)=>{
    const errorAndStatus = mapErrorsAndStatus.find((pair)=>error instanceof pair.classError);
    const status = errorAndStatus ? errorAndStatus.status : 400;
    return {
        status,
        body: {
            data: null,
            error: {
                status,
                name: error.name,
                message: error.message,
                details: error.details
            }
        }
    };
};
const formatHttpError = (error)=>{
    return {
        status: error.status,
        body: {
            data: null,
            error: {
                status: error.status,
                name: error.name,
                message: error.message,
                details: error.details
            }
        }
    };
};
const formatInternalError = (error)=>{
    if (!(error instanceof Error)) {
        return formatHttpError(createError(500));
    }
    const httpError = createError(error);
    if (httpError.expose) {
        return formatHttpError(httpError);
    }
    return formatHttpError(createError(httpError.status || 500));
};

exports.formatApplicationError = formatApplicationError;
exports.formatHttpError = formatHttpError;
exports.formatInternalError = formatInternalError;
//# sourceMappingURL=errors.js.map
