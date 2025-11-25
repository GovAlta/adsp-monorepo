'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('@strapi/types');
var passport = require('../../../../../server/src/services/passport.js');
var providerRegistry$1 = require('./provider-registry.js');

const providerRegistry = providerRegistry$1();
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

exports.SSOAuthEventsMapper = SSOAuthEventsMapper;
exports.default = sso;
exports.getStrategyCallbackURL = getStrategyCallbackURL;
exports.providerRegistry = providerRegistry;
exports.syncProviderRegistryWithConfig = syncProviderRegistryWithConfig;
//# sourceMappingURL=sso.js.map
