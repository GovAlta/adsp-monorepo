"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_passport_1 = __importDefault(require("koa-passport"));
function getStrategies({ tenantStrategy, coreStrategy }) {
    const tenantStrategyName = 'adsp-tenant';
    koa_passport_1.default.use(tenantStrategyName, tenantStrategy);
    const coreStrategyName = 'adsp-core';
    koa_passport_1.default.use(coreStrategyName, coreStrategy);
    function verify(auth, _config) {
        const { credentials: _user } = auth;
    }
    function authenticate(provider) {
        return async (ctx) => await new Promise((resolve) => koa_passport_1.default.authenticate(provider, { session: false }, (error, user) => error ? resolve({ error }) : resolve({ authenticated: !!user, credentials: user }))(ctx));
    }
    return {
        tenantStrategy: {
            name: tenantStrategyName,
            authenticate: authenticate(tenantStrategyName),
            verify,
        },
        coreStrategy: {
            name: coreStrategyName,
            authenticate: authenticate(coreStrategyName),
            verify,
        },
    };
}
exports.default = getStrategies;
//# sourceMappingURL=index.js.map