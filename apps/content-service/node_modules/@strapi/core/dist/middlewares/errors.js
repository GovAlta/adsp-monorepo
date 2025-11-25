'use strict';

var strapiUtils = require('@strapi/utils');
var errors = require('../services/errors.js');

const errorMiddleware = ()=>{
    return async (ctx, next)=>{
        try {
            await next();
            if (!ctx.response._explicitStatus) {
                return ctx.notFound();
            }
        } catch (error) {
            if (error instanceof strapiUtils.errors.ApplicationError) {
                const { status, body } = errors.formatApplicationError(error);
                ctx.status = status;
                ctx.body = body;
                return;
            }
            if (error instanceof strapiUtils.errors.HttpError) {
                const { status, body } = errors.formatHttpError(error);
                ctx.status = status;
                ctx.body = body;
                return;
            }
            strapi.log.error(error);
            const { status, body } = errors.formatInternalError(error);
            ctx.status = status;
            ctx.body = body;
        }
    };
};

exports.errors = errorMiddleware;
//# sourceMappingURL=errors.js.map
