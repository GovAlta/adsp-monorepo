'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');

const { RateLimitError } = utils.errors;
var rateLimit = ((config, { strapi })=>async (ctx, next)=>{
        const pluginConfig = strapi.config.get('plugin::email');
        const rateLimitConfig = {
            enabled: true,
            ...pluginConfig.ratelimit || {}
        };
        if (rateLimitConfig.enabled === true) {
            // TODO: TS - Do the dynamic import
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const rateLimit = require('koa2-ratelimit').RateLimit;
            const requestEmail = fp.get('request.body.email')(ctx);
            const userEmail = fp.isString(requestEmail) ? requestEmail.toLowerCase() : 'unknownEmail';
            const loadConfig = {
                interval: {
                    min: 5
                },
                max: 5,
                prefixKey: `${userEmail}`,
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
