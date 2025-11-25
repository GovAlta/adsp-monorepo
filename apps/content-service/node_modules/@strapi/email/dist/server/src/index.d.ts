/// <reference types="koa" />
declare const _default: {
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => Promise<void>;
    services: {
        email: () => {
            getProviderSettings: () => import("./types").EmailConfig;
            send: (options: import("./types").SendOptions) => Promise<any>;
            sendTemplatedEmail: (emailOptions: import("./types").EmailOptions, emailTemplate: import("./types").EmailTemplate, data: import("./types").EmailTemplateData) => any;
        };
    };
    routes: {
        admin: {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: (string | {
                        name: string;
                        config: {
                            actions: string[];
                        };
                    })[];
                };
            }[];
        };
        'content-api': () => {
            type: "content-api";
            routes: import("@strapi/types/dist/core").RouteInput[];
        };
    };
    controllers: {
        email: {
            send(ctx: import("koa").Context): Promise<void>;
            test(ctx: import("koa").Context): Promise<void>;
            getSettings(ctx: import("koa").Context): Promise<void>;
        };
    };
    config: import("./types").StrapiConfig;
    middlewares: {
        rateLimit: (config: any, { strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => (ctx: import("koa").Context, next: import("koa").Next) => Promise<any>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map