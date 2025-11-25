/// <reference types="koa" />
declare const _default: ({
    method: string;
    path: string;
    handler: string;
    config: {
        middlewares: string[];
        auth: {
            strategies: {
                name: string;
                authenticate: (ctx: import("koa").Context) => Promise<{
                    authenticated: boolean;
                    error?: undefined;
                    ability?: undefined;
                    credentials?: undefined;
                } | {
                    authenticated: boolean;
                    error: import("@strapi/utils/dist/errors").UnauthorizedError<"Token expired", unknown>;
                    ability?: undefined;
                    credentials?: undefined;
                } | {
                    authenticated: boolean;
                    ability: import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>;
                    credentials: import("../../../shared/contracts/transfer").SanitizedTransferToken;
                    error?: undefined;
                }>;
                verify: (auth: any, config?: any) => Promise<void>;
            }[];
            scope: string[];
        };
        policies?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        middlewares: string[];
        policies: (string | {
            name: string;
            config: {
                actions: string[];
            };
        })[];
        auth?: undefined;
    };
})[];
export default _default;
//# sourceMappingURL=transfer.d.ts.map