'use strict';

var strapiUtils = require('@strapi/utils');

const createPolicicesMiddleware = (route, strapi)=>{
    const policiesConfig = route?.config?.policies ?? [];
    const resolvedPolicies = strapi.get('policies').resolve(policiesConfig, route.info);
    const policiesMiddleware = async (ctx, next)=>{
        const context = strapiUtils.policy.createPolicyContext('koa', ctx);
        for (const { handler, config } of resolvedPolicies){
            const result = await handler(context, config, {
                strapi
            });
            if (![
                true,
                undefined
            ].includes(result)) {
                throw new strapiUtils.errors.PolicyError();
            }
        }
        await next();
    };
    return policiesMiddleware;
};

exports.createPolicicesMiddleware = createPolicicesMiddleware;
//# sourceMappingURL=policy.js.map
