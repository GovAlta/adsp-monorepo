import utils from '@strapi/utils';
import { get, isString } from 'lodash/fp';

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
            const requestEmail = get('request.body.email')(ctx);
            const userEmail = isString(requestEmail) ? requestEmail.toLowerCase() : 'unknownEmail';
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

export { rateLimit as default };
//# sourceMappingURL=rateLimit.mjs.map
