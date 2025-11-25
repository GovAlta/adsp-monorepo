import type { Context } from 'koa';
import { errors } from '@strapi/utils';
/**
 * Authenticate the validity of the token
 *
 *  @type {import('.').AuthenticateFunction}
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
    credentials: import("../../../shared/contracts/transfer").SanitizedTransferToken;
    error?: undefined;
}>;
/**
 * Verify the token has the required abilities for the requested scope
 *
 *  @type {import('.').VerifyFunction}
 */
export declare const verify: (auth: any, config?: any) => Promise<void>;
export declare const name = "data-transfer";
/** @type {import('.').AuthStrategy} */
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
        credentials: import("../../../shared/contracts/transfer").SanitizedTransferToken;
        error?: undefined;
    }>;
    verify: (auth: any, config?: any) => Promise<void>;
};
export default _default;
//# sourceMappingURL=data-transfer.d.ts.map