import '@strapi/types';
import passport from '../../../../../server/src/services/passport.mjs';
import createProviderRegistry from './provider-registry.mjs';

const providerRegistry = createProviderRegistry();
const errorMessage = 'SSO is disabled. Its functionnalities cannot be accessed.';
const getStrategyCallbackURL = (providerName)=>{
    if (!strapi.ee.features.isEnabled('sso')) {
        throw new Error(errorMessage);
    }
    return `/admin/connect/${providerName}`;
};
const syncProviderRegistryWithConfig = ()=>{
    if (!strapi.ee.features.isEnabled('sso')) {
        throw new Error(errorMessage);
    }
    const { providers = [] } = strapi.config.get('admin.auth', {});
    // TODO
    // @ts-expect-error check map types
    providerRegistry.registerMany(providers);
};
const SSOAuthEventsMapper = {
    onSSOAutoRegistration: 'admin.auth.autoRegistration'
};
var sso = {
    providerRegistry,
    getStrategyCallbackURL,
    syncProviderRegistryWithConfig,
    authEventsMapper: {
        ...passport.authEventsMapper,
        ...SSOAuthEventsMapper
    }
};

export { SSOAuthEventsMapper, sso as default, getStrategyCallbackURL, providerRegistry, syncProviderRegistryWithConfig };
//# sourceMappingURL=sso.mjs.map
