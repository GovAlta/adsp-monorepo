import { errors } from '@strapi/database';
import { errors as errors$1 } from '@strapi/utils';

const databaseErrorsToTransform = [
    errors.InvalidTimeError,
    errors.InvalidDateTimeError,
    errors.InvalidDateError,
    errors.InvalidRelationError
];
/**
 * Handle database errors
 */ const databaseErrorsMiddleware = async (ctx, next)=>{
    try {
        return await next();
    } catch (error) {
        if (databaseErrorsToTransform.some((errorToTransform)=>error instanceof errorToTransform)) {
            if (error instanceof Error) {
                throw new errors$1.ValidationError(error.message);
            }
            throw error;
        }
        throw error;
    }
};

export { databaseErrorsMiddleware };
//# sourceMappingURL=errors.mjs.map
