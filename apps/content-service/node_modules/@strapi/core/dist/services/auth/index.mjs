import assert from 'assert/strict';
import { has } from 'lodash/fp';
import { errors } from '@strapi/utils';

const INVALID_STRATEGY_MSG = 'Invalid auth strategy. Expecting an object with properties {name: string, authenticate: function, verify: function}';
const validStrategy = (strategy)=>{
    assert(has('authenticate', strategy), INVALID_STRATEGY_MSG);
    assert(typeof strategy.authenticate === 'function', INVALID_STRATEGY_MSG);
    if (has('verify', strategy)) {
        assert(typeof strategy.verify === 'function', INVALID_STRATEGY_MSG);
    }
};
const createAuthentication = ()=>{
    const strategies = {};
    return {
        register (type, strategy) {
            validStrategy(strategy);
            if (!strategies[type]) {
                strategies[type] = [];
            }
            strategies[type].push(strategy);
            return this;
        },
        async authenticate (ctx, next) {
            const route = ctx.state.route;
            // use route strategy
            const config = route?.config?.auth;
            if (config === false) {
                return next();
            }
            const routeStrategies = route.info.type ? strategies[route.info.type] : [];
            const configStrategies = config?.strategies ?? routeStrategies ?? [];
            const strategiesToUse = configStrategies.reduce((acc, strategy)=>{
                // Resolve by strategy name
                if (typeof strategy === 'string') {
                    const routeStrategy = routeStrategies.find((rs)=>rs.name === strategy);
                    if (routeStrategy) {
                        acc.push(routeStrategy);
                    }
                } else if (typeof strategy === 'object') {
                    validStrategy(strategy);
                    acc.push(strategy);
                }
                return acc;
            }, []);
            for (const strategy of strategiesToUse){
                const result = await strategy.authenticate(ctx);
                const { authenticated = false, credentials, ability = null, error = null } = result || {};
                if (error !== null) {
                    return ctx.unauthorized(error);
                }
                if (authenticated) {
                    ctx.state.isAuthenticated = true;
                    ctx.state.auth = {
                        strategy,
                        credentials,
                        ability
                    };
                    return next();
                }
            }
            return ctx.unauthorized('Missing or invalid credentials');
        },
        async verify (auth, config = {}) {
            if (config === false) {
                return;
            }
            if (!auth) {
                throw new errors.UnauthorizedError();
            }
            if (typeof auth.strategy.verify === 'function') {
                return auth.strategy.verify(auth, config);
            }
        }
    };
};

export { createAuthentication as default };
//# sourceMappingURL=index.mjs.map
