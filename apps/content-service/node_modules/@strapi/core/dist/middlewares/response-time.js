'use strict';

const responseTime = ()=>{
    return async (ctx, next)=>{
        const start = Date.now();
        await next();
        const delta = Math.ceil(Date.now() - start);
        ctx.set('X-Response-Time', `${delta}ms`);
    };
};

exports.responseTime = responseTime;
//# sourceMappingURL=response-time.js.map
