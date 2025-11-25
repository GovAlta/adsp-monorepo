'use strict';

var database = require('@strapi/database');
var strapiUtils = require('@strapi/utils');

const databaseErrorsToTransform = [
    database.errors.InvalidTimeError,
    database.errors.InvalidDateTimeError,
    database.errors.InvalidDateError,
    database.errors.InvalidRelationError
];
/**
 * Handle database errors
 */ const databaseErrorsMiddleware = async (ctx, next)=>{
    try {
        return await next();
    } catch (error) {
        if (databaseErrorsToTransform.some((errorToTransform)=>error instanceof errorToTransform)) {
            if (error instanceof Error) {
                throw new strapiUtils.errors.ValidationError(error.message);
            }
            throw error;
        }
        throw error;
    }
};

exports.databaseErrorsMiddleware = databaseErrorsMiddleware;
//# sourceMappingURL=errors.js.map
