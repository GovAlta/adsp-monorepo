declare const _default: {
    type: string;
    routes: ({
        method: string;
        path: string;
        handler: string;
        config: {
            middlewares: import("@strapi/types/dist/core").MiddlewareHandler[];
            auth: boolean;
            policies?: undefined;
        };
    } | {
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
            auth?: undefined;
        };
    })[];
};
export default _default;
//# sourceMappingURL=sso.d.ts.map