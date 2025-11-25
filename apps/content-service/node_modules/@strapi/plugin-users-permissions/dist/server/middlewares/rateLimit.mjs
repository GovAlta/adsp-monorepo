import require$$1 from 'path';
import require$$1$1 from '@strapi/utils';
import require$$0 from 'lodash/fp';
import require$$3 from 'koa2-ratelimit';

var rateLimit;
var hasRequiredRateLimit;
function requireRateLimit() {
    if (hasRequiredRateLimit) return rateLimit;
    hasRequiredRateLimit = 1;
    const path = require$$1;
    const utils = require$$1$1;
    const { isString, has, toLower } = require$$0;
    const { RateLimitError } = utils.errors;
    rateLimit = (config, { strapi })=>async (ctx, next)=>{
            let rateLimitConfig = strapi.config.get('plugin::users-permissions.ratelimit');
            if (!rateLimitConfig) {
                rateLimitConfig = {
                    enabled: true
                };
            }
            if (!has('enabled', rateLimitConfig)) {
                rateLimitConfig.enabled = true;
            }
            if (rateLimitConfig.enabled === true) {
                const rateLimit = require$$3.RateLimit;
                const userIdentifier = toLower(ctx.request.body.email) || 'unknownIdentifier';
                const requestPath = isString(ctx.request.path) ? toLower(path.normalize(ctx.request.path)) : 'invalidPath';
                const loadConfig = {
                    interval: {
                        min: 5
                    },
                    max: 5,
                    prefixKey: `${userIdentifier}:${requestPath}:${ctx.request.ip}`,
                    handler () {
                        throw new RateLimitError();
                    },
                    ...rateLimitConfig,
                    ...config
                };
                return rateLimit.middleware(loadConfig)(ctx, next);
            }
            return next();
        };
    return rateLimit;
}

export { requireRateLimit as __require };
//# sourceMappingURL=rateLimit.mjs.map
