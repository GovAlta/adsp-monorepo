import type { Context } from 'koa';
/** @type {import('.').AuthenticateFunction} */
export declare const authenticate: (ctx: Context) => Promise<{
    authenticated: boolean;
    credentials?: undefined;
    ability?: undefined;
} | {
    authenticated: boolean;
    credentials: any;
    ability: import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>;
}>;
export declare const name = "admin";
/** @type {import('.').AuthStrategy} */
declare const _default: {
    name: string;
    authenticate: (ctx: Context) => Promise<{
        authenticated: boolean;
        credentials?: undefined;
        ability?: undefined;
    } | {
        authenticated: boolean;
        credentials: any;
        ability: import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>;
    }>;
};
export default _default;
//# sourceMappingURL=admin.d.ts.map