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

export { poweredBy };
//# sourceMappingURL=powered-by.mjs.map
