'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

/**
 * Returns a single type controller to handle default core-api actions
 */ const createSingleTypeController = ({ contentType })=>{
    const uid = contentType.uid;
    // TODO: transform into a class
    return {
        /**
     * Retrieve single type content
     *
     */ async find (ctx) {
            await this.validateQuery(ctx);
            const sanitizedQuery = await this.sanitizeQuery(ctx);
            const entity = await strapi.service(uid).find(sanitizedQuery);
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        },
        /**
     * create or update single type content.
     */ async update (ctx) {
            const { query, body = {} } = ctx.request;
            if (!fp.isObject(body.data)) {
                throw new strapiUtils.errors.ValidationError('Missing "data" payload in the request body');
            }
            await this.validateInput(body.data, ctx);
            const sanitizedInputData = await this.sanitizeInput(body.data, ctx);
            const entity = await strapi.service(uid).createOrUpdate({
                ...query,
                data: sanitizedInputData
            });
            const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
            return this.transformResponse(sanitizedEntity);
        },
        async delete (ctx) {
            const { query } = ctx;
            await strapi.service(uid).delete(query);
            ctx.status = 204;
        }
    };
};

exports.createSingleTypeController = createSingleTypeController;
//# sourceMappingURL=single-type.js.map
