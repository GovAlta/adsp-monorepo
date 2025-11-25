'use strict';

const defaults = {
    poweredBy: 'Strapi <strapi.io>'
};
const poweredBy = (config)=>{
    const { poweredBy } = {
        ...defaults,
        ...config
    };
    return async (ctx, next)=>{
        await next();
        ctx.set('X-Powered-By', poweredBy);
    };
};

exports.poweredBy = poweredBy;
//# sourceMappingURL=powered-by.js.map
