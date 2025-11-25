import type { ParameterizedContext } from 'koa';
declare const requestCtx: {
    run(store: ParameterizedContext, cb: () => Promise<void>): Promise<void>;
    get(): ParameterizedContext | undefined;
};
export default requestCtx;
//# sourceMappingURL=request-context.d.ts.map