declare const _default: {
    homepage: import("@strapi/types/dist/core").Router;
    admin: {
        type: string;
        routes: ({
            method: string;
            path: string;
            handler: string;
            config: {
                policies: string[];
                middlewares?: undefined;
            };
        } | {
            method: string;
            path: string;
            handler: string;
            config: {
                middlewares: ((ctx: import("koa").Context, next: import("koa").Next) => Promise<any>)[];
                policies: (string | {
                    name: string;
                    config: {
                        actions: string[];
                    };
                })[];
            };
        } | {
            method: string;
            path: string;
            handler: string;
            config: {
                middlewares: ((ctx: import("koa").Context, next: import("koa").Next) => Promise<any>)[];
                policies: (string | {
                    name: string;
                    config: {
                        actions: string[];
                        hasAtLeastOne: boolean;
                    };
                })[];
            };
        })[];
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map