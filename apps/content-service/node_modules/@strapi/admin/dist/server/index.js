'use strict';

var _ = require('lodash');
var bootstrap = require('./server/src/bootstrap.js');
var register = require('./server/src/register.js');
var destroy = require('./server/src/destroy.js');
var index$1 = require('./server/src/config/index.js');
var index$2 = require('./server/src/policies/index.js');
var index$3 = require('./server/src/routes/index.js');
var index$4 = require('./server/src/services/index.js');
var index$5 = require('./server/src/controllers/index.js');
var index$6 = require('./server/src/content-types/index.js');
var index$7 = require('./server/src/middlewares/index.js');
var index = require('./ee/server/src/index.js');

// eslint-disable-next-line import/no-mutable-exports
let admin = {
    bootstrap,
    register,
    destroy,
    config: index$1.default,
    policies: index$2,
    routes: index$3,
    services: index$4,
    controllers: index$5,
    contentTypes: index$6,
    middlewares: index$7.default
};
const mergeRoutes = (a, b, key)=>{
    return _.isArray(a) && _.isArray(b) && key === 'routes' ? a.concat(b) : undefined;
};
if (strapi.EE) {
    admin = _.mergeWith({}, admin, index(), mergeRoutes);
}
var admin$1 = admin;

module.exports = admin$1;
//# sourceMappingURL=index.js.map
