const runMiddleware = async (context, middlewares)=>{
    if (!middlewares.length) {
        return;
    }
    const cb = middlewares[0];
    await cb(context, async (newContext)=>{
        await runMiddleware(newContext, middlewares.slice(1));
    });
};

export { runMiddleware };
//# sourceMappingURL=middleware.mjs.map
