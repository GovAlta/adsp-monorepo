'use strict';

var path = require('path');
var utils = require('@strapi/utils');
var fp = require('lodash/fp');

const { RateLimitError } = utils.errors;
var rateLimit = ((config, { strapi })=>async (ctx, next)=>{
        let rateLimitConfig = strapi.config.get('admin.rateLimit');
        if (!rateLimitConfig) {
            rateLimitConfig = {
                enabled: true
            };
        }
        if (!fp.has('enabled', rateLimitConfig)) {
            rateLimitConfig.enabled = true;
        }
        if (rateLimitConfig.enabled === true) {
            // TODO: TS - Do the dynamic import
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const rateLimit = require('koa2-ratelimit').RateLimit;
            const requestEmail = fp.get('request.body.email')(ctx);
            const userEmail = fp.isString(requestEmail) ? requestEmail.toLowerCase() : 'unknownEmail';
            const requestPath = fp.isString(ctx.request.path) ? fp.toLower(path.normalize(ctx.request.path)).replace(/\/$/, '') : 'invalidPath';
            const loadConfig = {
                interval: {
                    min: 5
                },
                max: 5,
                prefixKey: `${userEmail}:${requestPath}:${ctx.request.ip}`,
                handler () {
                    throw new RateLimitError();
                },
                ...rateLimitConfig,
                ...config
            };
            return rateLimit.middleware(loadConfig)(ctx, next);
        }
        return next();
    });

module.exports = rateLimit;
//# sourceMappingURL=rateLimit.js.map
