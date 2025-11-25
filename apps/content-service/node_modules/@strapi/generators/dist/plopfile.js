'use strict';

var pluralize = require('pluralize');
var api = require('./plops/api.js');
var controller = require('./plops/controller.js');
var contentType = require('./plops/content-type.js');
var policy = require('./plops/policy.js');
var middleware = require('./plops/middleware.js');
var migration = require('./plops/migration.js');
var service = require('./plops/service.js');

var plopfile = ((plop)=>{
    // Plop config
    plop.setWelcomeMessage('Strapi Generators');
    plop.setHelper('pluralize', (text)=>pluralize(text));
    // Generators
    api(plop);
    controller(plop);
    contentType(plop);
    policy(plop);
    middleware(plop);
    migration(plop);
    service(plop);
});

module.exports = plopfile;
//# sourceMappingURL=plopfile.js.map
