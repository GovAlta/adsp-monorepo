import ___default from 'lodash';
import bootstrap from './server/src/bootstrap.mjs';
import register from './server/src/register.mjs';
import destroy from './server/src/destroy.mjs';
import config from './server/src/config/index.mjs';
import policies from './server/src/policies/index.mjs';
import routes from './server/src/routes/index.mjs';
import services from './server/src/services/index.mjs';
import controllers from './server/src/controllers/index.mjs';
import contentTypes from './server/src/content-types/index.mjs';
import middlewares from './server/src/middlewares/index.mjs';
import getAdminEE from './ee/server/src/index.mjs';

// eslint-disable-next-line import/no-mutable-exports
let admin = {
    bootstrap,
    register,
    destroy,
    config,
    policies,
    routes,
    services,
    controllers,
    contentTypes,
    middlewares
};
const mergeRoutes = (a, b, key)=>{
    return ___default.isArray(a) && ___default.isArray(b) && key === 'routes' ? a.concat(b) : undefined;
};
if (strapi.EE) {
    admin = ___default.mergeWith({}, admin, getAdminEE(), mergeRoutes);
}
var admin$1 = admin;

export { admin$1 as default };
//# sourceMappingURL=index.mjs.map
