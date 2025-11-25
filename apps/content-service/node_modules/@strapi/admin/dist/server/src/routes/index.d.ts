/// <reference types="koa" />
declare const routes: {
    admin: {
        type: string;
        routes: ({
            method: string;
            path: string;
            handler: string;
            config: {
                auth: boolean;
                policies?: undefined;
            };
        } | {
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
        } | {
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
        })[];
    };
};
export default routes;
//# sourceMappingURL=index.d.ts.map