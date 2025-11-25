const createMiddlewareManager = ()=>{
    const middlewares = [];
    const manager = {
        use (middleware) {
            middlewares.push(middleware);
            return ()=>middlewares.splice(middlewares.indexOf(middleware), 1);
        },
        async run (ctx, cb) {
            let index = 0;
            const next = async ()=>{
                if (index < middlewares.length) {
                    // eslint-disable-next-line no-plusplus
                    return middlewares[index++](ctx, next);
                }
                return cb();
            };
            return next();
        },
        wrapObject (source, ctxDefaults = {}, opts = {}) {
            const facade = {};
            const { exclude = [] } = opts;
            for(const key in source){
                if (Object.hasOwnProperty.call(source, key)) {
                    const prop = source[key];
                    if (exclude.includes(key)) {
                        facade[key] = prop;
                    } else if (typeof prop === 'function') {
                        const newMethod = async (params = {})=>{
                            const ctx = {
                                ...ctxDefaults,
                                action: key,
                                params
                            };
                            return manager.run(ctx, ()=>prop(ctx.params));
                        };
                        facade[key] = newMethod;
                    } else {
                        facade[key] = prop;
                    }
                }
            }
            return facade;
        }
    };
    return manager;
};

export { createMiddlewareManager };
//# sourceMappingURL=middleware-manager.mjs.map
