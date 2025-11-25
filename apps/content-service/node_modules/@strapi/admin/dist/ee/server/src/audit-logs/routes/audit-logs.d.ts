declare const _default: {
    type: string;
    routes: {
        method: string;
        path: string;
        handler: string;
        config: {
            middlewares: import("@strapi/types/dist/core").MiddlewareHandler[];
            policies: (string | {
                name: string;
                config: {
                    actions: string[];
                };
            })[];
        };
    }[];
};
export default _default;
//# sourceMappingURL=audit-logs.d.ts.map