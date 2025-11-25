'use strict';

var fp = require('lodash/fp');
var compose = require('koa-compose');
var utils$1 = require('@strapi/utils');
var authentication$1 = require('../validation/authentication.js');
var middlewares = require('./authentication-utils/middlewares.js');
var utils = require('./authentication-utils/utils.js');

const toProviderDTO = fp.pick([
    'uid',
    'displayName',
    'icon'
]);
const toProviderLoginOptionsDTO = fp.pick([
    'autoRegister',
    'defaultRole',
    'ssoLockedRoles'
]);
const { ValidationError } = utils$1.errors;
const providerAuthenticationFlow = compose([
    middlewares.default.authenticate,
    middlewares.default.redirectWithAuth
]);
var authentication = {
    async getProviders (ctx) {
        const { providerRegistry } = strapi.service('admin::passport');
        ctx.body = providerRegistry.getAll().map(toProviderDTO);
    },
    async getProviderLoginOptions (ctx) {
        const adminStore = await utils.default.getAdminStore();
        const { providers: providersOptions } = await adminStore.get({
            key: 'auth'
        });
        ctx.body = {
            data: toProviderLoginOptionsDTO(providersOptions)
        };
    },
    async updateProviderLoginOptions (ctx) {
        const { request: { body } } = ctx;
        await authentication$1.validateProviderOptionsUpdate(body);
        const adminStore = await utils.default.getAdminStore();
        const currentAuthOptions = await adminStore.get({
            key: 'auth'
        });
        const newAuthOptions = {
            ...currentAuthOptions,
            providers: body
        };
        await adminStore.set({
            key: 'auth',
            value: newAuthOptions
        });
        strapi.telemetry.send('didUpdateSSOSettings');
        ctx.body = {
            data: toProviderLoginOptionsDTO(newAuthOptions.providers)
        };
    },
    providerLogin (ctx, next) {
        const { params: { provider: providerName } } = ctx;
        const { providerRegistry } = strapi.service('admin::passport');
        if (!providerRegistry.has(providerName)) {
            throw new ValidationError(`Invalid provider supplied: ${providerName}`);
        }
        return providerAuthenticationFlow(ctx, next);
    }
};

module.exports = authentication;
//# sourceMappingURL=authentication.js.map
