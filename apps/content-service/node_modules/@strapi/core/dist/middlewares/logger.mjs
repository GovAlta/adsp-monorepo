const logger = (_, { strapi })=>{
    return async (ctx, next)=>{
        const start = Date.now();
        await next();
        const delta = Math.ceil(Date.now() - start);
        strapi.log.http(`${ctx.method} ${ctx.url} (${delta} ms) ${ctx.status}`);
    };
};

export { logger };
//# sourceMappingURL=logger.mjs.map
