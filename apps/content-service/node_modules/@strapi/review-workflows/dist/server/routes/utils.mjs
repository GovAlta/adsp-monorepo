const enableFeatureMiddleware = (featureName)=>(ctx, next)=>{
        if (strapi.ee.features.isEnabled(featureName)) {
            return next();
        }
        ctx.status = 404;
    };

export { enableFeatureMiddleware };
//# sourceMappingURL=utils.mjs.map
