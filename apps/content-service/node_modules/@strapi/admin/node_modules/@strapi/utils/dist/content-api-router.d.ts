/**
 * Creates a content-api route factory that exposes `routes` on the factory function for backward compatibility.
 *
 * This allows legacy extensions to mutate `plugin.routes["content-api"].routes` directly.
 */
export declare const createContentApiRoutesFactory: <TRoutes>(buildRoutes: () => TRoutes) => () => {
    type: "content-api";
    routes: TRoutes;
};
export type ContentApiRoutesFactory<TRoutes> = ReturnType<typeof createContentApiRoutesFactory<TRoutes>> & {
    routes: TRoutes;
};
//# sourceMappingURL=content-api-router.d.ts.map