import { isFunction } from 'lodash/fp';

const responses = (config = {})=>{
    return async (ctx, next)=>{
        await next();
        const { status } = ctx;
        const handler = config?.handlers?.[status];
        if (isFunction(handler)) {
            await handler(ctx, next);
        }
    };
};

export { responses };
//# sourceMappingURL=responses.mjs.map
