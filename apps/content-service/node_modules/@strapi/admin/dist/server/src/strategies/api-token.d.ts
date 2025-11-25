import type { Context } from 'koa';
import { errors } from '@strapi/utils';
import '@strapi/types';
/**
 * Authenticate the validity of the token
 */
export declare const authenticate: (ctx: Context) => Promise<{
    authenticated: boolean;
    error?: undefined;
    ability?: undefined;
    credentials?: undefined;
} | {
    authenticated: boolean;
    error: errors.UnauthorizedError<"Token expired", unknown>;
    ability?: undefined;
    credentials?: undefined;
} | {
    authenticated: boolean;
    ability: import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>;
    credentials: import("../../../shared/contracts/api-token").ApiToken;
    error?: undefined;
} | {
    authenticated: boolean;
    credentials: import("../../../shared/contracts/api-token").ApiToken;
    error?: undefined;
    ability?: undefined;
}>;
/**
 * Verify the token has the required abilities for the requested scope
 *
 *  @type {import('.').VerifyFunction}
 */
export declare const verify: (auth: any, config: any) => void;
export declare const name = "api-token";
declare const _default: {
    name: string;
    authenticate: (ctx: Context) => Promise<{
        authenticated: boolean;
        error?: undefined;
        ability?: undefined;
        credentials?: undefined;
    } | {
        authenticated: boolean;
        error: errors.UnauthorizedError<"Token expired", unknown>;
        ability?: undefined;
        credentials?: undefined;
    } | {
        authenticated: boolean;
        ability: import("@casl/ability").Ability<import("@casl/ability").AbilityTuple, any>;
        credentials: import("../../../shared/contracts/api-token").ApiToken;
        error?: undefined;
    } | {
        authenticated: boolean;
        credentials: import("../../../shared/contracts/api-token").ApiToken;
        error?: undefined;
        ability?: undefined;
    }>;
    verify: (auth: any, config: any) => void;
};
export default _default;
//# sourceMappingURL=api-token.d.ts.map