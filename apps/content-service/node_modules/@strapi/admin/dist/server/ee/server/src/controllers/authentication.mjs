import { pick } from 'lodash/fp';
import compose from 'koa-compose';
import { errors } from '@strapi/utils';
import { validateProviderOptionsUpdate } from '../validation/authentication.mjs';
import middlewares from './authentication-utils/middlewares.mjs';
import utils from './authentication-utils/utils.mjs';

const toProviderDTO = pick([
    'uid',
    'displayName',
    'icon'
]);
const toProviderLoginOptionsDTO = pick([
    'autoRegister',
    'defaultRole',
    'ssoLockedRoles'
]);
const { ValidationError } = errors;
const providerAuthenticationFlow = compose([
    middlewares.authenticate,
    middlewares.redirectWithAuth
]);
var authentication = {
    async getProviders (ctx) {
        const { providerRegistry } = strapi.service('admin::passport');
        ctx.body = providerRegistry.getAll().map(toProviderDTO);
    },
    async getProviderLoginOptions (ctx) {
        const adminStore = await utils.getAdminStore();
        const { providers: providersOptions } = await adminStore.get({
            key: 'auth'
        });
        ctx.body = {
            data: toProviderLoginOptionsDTO(providersOptions)
        };
    },
    async updateProviderLoginOptions (ctx) {
        const { request: { body } } = ctx;
        await validateProviderOptionsUpdate(body);
        const adminStore = await utils.getAdminStore();
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

export { authentication as default };
//# sourceMappingURL=authentication.mjs.map
