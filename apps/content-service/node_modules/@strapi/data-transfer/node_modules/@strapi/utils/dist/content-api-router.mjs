/**
 * Creates a content-api route factory that exposes `routes` on the factory function for backward compatibility.
 *
 * This allows legacy extensions to mutate `plugin.routes["content-api"].routes` directly.
 */ const createContentApiRoutesFactory = (buildRoutes)=>{
    let sharedRoutes;
    const ensureSharedRoutes = ()=>{
        if (!sharedRoutes) {
            sharedRoutes = buildRoutes();
        }
        return sharedRoutes;
    };
    const createContentApiRoutes = ()=>{
        return {
            type: 'content-api',
            routes: ensureSharedRoutes()
        };
    };
    Object.defineProperty(createContentApiRoutes, 'routes', {
        get: ensureSharedRoutes,
        set (next) {
            sharedRoutes = next;
        },
        enumerable: true
    });
    return createContentApiRoutes;
};

export { createContentApiRoutesFactory };
//# sourceMappingURL=content-api-router.mjs.map
