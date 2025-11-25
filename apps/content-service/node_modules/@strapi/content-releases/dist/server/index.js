'use strict';

var register = require('./register.js');
var bootstrap = require('./bootstrap.js');
var destroy = require('./destroy.js');
var index$1 = require('./content-types/index.js');
var index$2 = require('./services/index.js');
var index$3 = require('./controllers/index.js');
var index$4 = require('./routes/index.js');

const getPlugin = ()=>{
    if (strapi.ee.features.isEnabled('cms-content-releases')) {
        return {
            register: register.register,
            bootstrap: bootstrap.bootstrap,
            destroy: destroy.destroy,
            contentTypes: index$1.contentTypes,
            services: index$2.services,
            controllers: index$3.controllers,
            routes: index$4.routes
        };
    }
    return {
        // Always return register, it handles its own feature check
        register: register.register,
        // Always return contentTypes to avoid losing data when the feature is disabled
        contentTypes: index$1.contentTypes
    };
};
var index = getPlugin();

module.exports = index;
//# sourceMappingURL=index.js.map
