import { isNil, castArray } from 'lodash/fp';
import { differenceInHours, parseISO } from 'date-fns';
import { errors } from '@strapi/utils';
import constants from '../services/constants.mjs';
import { getService } from '../utils/index.mjs';
import '@strapi/types';

const { UnauthorizedError, ForbiddenError } = errors;
const isReadScope = (scope)=>scope.endsWith('find') || scope.endsWith('findOne');
const extractToken = (ctx)=>{
    if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
        const parts = ctx.request.header.authorization.split(/\s+/);
        if (parts[0].toLowerCase() !== 'bearer' || parts.length !== 2) {
            return null;
        }
        return parts[1];
    }
    return null;
};
/**
 * Authenticate the validity of the token
 */ const authenticate = async (ctx)=>{
    const apiTokenService = getService('api-token');
    const token = extractToken(ctx);
    if (!token) {
        return {
            authenticated: false
        };
    }
    const apiToken = await apiTokenService.getBy({
        accessKey: apiTokenService.hash(token)
    });
    // token not found
    if (!apiToken) {
        return {
            authenticated: false
        };
    }
    const currentDate = new Date();
    if (!isNil(apiToken.expiresAt)) {
        const expirationDate = new Date(apiToken.expiresAt);
        // token has expired
        if (expirationDate < currentDate) {
            return {
                authenticated: false,
                error: new UnauthorizedError('Token expired')
            };
        }
    }
    if (!isNil(apiToken.lastUsedAt)) {
        // update lastUsedAt if the token has not been used in the last hour
        const hoursSinceLastUsed = differenceInHours(currentDate, parseISO(apiToken.lastUsedAt));
        if (hoursSinceLastUsed >= 1) {
            await strapi.db.query('admin::api-token').update({
                where: {
                    id: apiToken.id
                },
                data: {
                    lastUsedAt: currentDate
                }
            });
        }
    } else {
        // If lastUsedAt is not set, initialize it to the current date
        await strapi.db.query('admin::api-token').update({
            where: {
                id: apiToken.id
            },
            data: {
                lastUsedAt: currentDate
            }
        });
    }
    if (apiToken.type === constants.API_TOKEN_TYPE.CUSTOM) {
        const ability = await strapi.contentAPI.permissions.engine.generateAbility(apiToken.permissions.map((action)=>({
                action
            })));
        return {
            authenticated: true,
            ability,
            credentials: apiToken
        };
    }
    return {
        authenticated: true,
        credentials: apiToken
    };
};
/**
 * Verify the token has the required abilities for the requested scope
 *
 *  @type {import('.').VerifyFunction}
 */ const verify = (auth, config)=>{
    const { credentials: apiToken, ability } = auth;
    if (!apiToken) {
        throw new UnauthorizedError('Token not found');
    }
    const currentDate = new Date();
    if (!isNil(apiToken.expiresAt)) {
        const expirationDate = new Date(apiToken.expiresAt);
        // token has expired
        if (expirationDate < currentDate) {
            throw new UnauthorizedError('Token expired');
        }
    }
    // Full access
    if (apiToken.type === constants.API_TOKEN_TYPE.FULL_ACCESS) {
        return;
    }
    // Read only
    if (apiToken.type === constants.API_TOKEN_TYPE.READ_ONLY) {
        /**
     * If you don't have `full-access` you can only access `find` and `findOne`
     * scopes. If the route has no scope, then you can't get access to it.
     */ const scopes = castArray(config.scope);
        if (config.scope && scopes.every(isReadScope)) {
            return;
        }
    } else if (apiToken.type === constants.API_TOKEN_TYPE.CUSTOM) {
        if (!ability) {
            throw new ForbiddenError();
        }
        const scopes = castArray(config.scope);
        const isAllowed = scopes.every((scope)=>ability.can(scope));
        if (isAllowed) {
            return;
        }
    }
    throw new ForbiddenError();
};
var apiTokenAuthStrategy = {
    name: 'api-token',
    authenticate,
    verify
};

export { authenticate, apiTokenAuthStrategy as default, verify };
//# sourceMappingURL=api-token.mjs.map
