declare const _default: {
    sso: {
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
    'license-limit': {
        type: string;
        routes: {
            method: string;
            path: string;
            handler: string;
            config: {
                policies: string[];
            };
        }[];
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map