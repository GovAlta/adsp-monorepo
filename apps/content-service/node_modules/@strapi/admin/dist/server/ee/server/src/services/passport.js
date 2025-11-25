'use strict';

var utils = require('@strapi/utils');
var localStrategy = require('../../../../server/src/services/passport/local-strategy.js');
var sso = require('./passport/sso.js');
var ssoLock = require('../utils/sso-lock.js');

const { UnauthorizedError } = utils.errors;
const localStrategyMiddleware = async ([error, user, message], done)=>{
    // if we got a user, we need to check that it's not sso locked
    if (user && !error && await ssoLock.isSsoLocked(user)) {
        return done(new UnauthorizedError('Login not allowed, please contact your administrator', {
            code: 'LOGIN_NOT_ALLOWED'
        }), user, message);
    }
    return done(error, user, message);
};
const getPassportStrategies = ()=>{
    if (!strapi.ee.features.isEnabled('sso')) {
        return [
            localStrategy(strapi)
        ];
    }
    const localStrategy$1 = localStrategy(strapi, localStrategyMiddleware);
    if (!strapi.isLoaded) {
        sso.default.syncProviderRegistryWithConfig();
    }
    // TODO
    // @ts-expect-error check map types
    const providers = sso.default.providerRegistry.getAll();
    const strategies = providers.map((provider)=>provider.createStrategy(strapi));
    return [
        localStrategy$1,
        ...strategies
    ];
};
var passport = {
    getPassportStrategies,
    ...sso.default
};

module.exports = passport;
//# sourceMappingURL=passport.js.map
