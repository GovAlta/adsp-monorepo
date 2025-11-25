export type Middleware = (ctx: any, next: () => Promise<void>) => Promise<void> | void;
export type Options = {
    exclude?: string[];
};
export declare const createMiddlewareManager: () => {
    use(middleware: Middleware): () => Middleware[];
    run(ctx: any, cb: () => void): Promise<void>;
    wrapObject<TSource>(source: TSource, ctxDefaults?: {}, opts?: Options): TSource;
};
//# sourceMappingURL=middleware-manager.d.ts.map