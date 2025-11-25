import type Koa from 'koa';
declare const releaseController: {
    /**
     * Find releases based on documents attached or not to the release.
     * If `hasEntryAttached` is true, it will return all releases that have the entry attached.
     * If `hasEntryAttached` is false, it will return all releases that don't have the entry attached.
     */
    findByDocumentAttached(ctx: Koa.Context): Promise<void>;
    findPage(ctx: Koa.Context): Promise<void>;
    findOne(ctx: Koa.Context): Promise<void>;
    mapEntriesToReleases(ctx: Koa.Context): Promise<void>;
    create(ctx: Koa.Context): Promise<void>;
    update(ctx: Koa.Context): Promise<void>;
    delete(ctx: Koa.Context): Promise<void>;
    publish(ctx: Koa.Context): Promise<void>;
};
export default releaseController;
//# sourceMappingURL=release.d.ts.map