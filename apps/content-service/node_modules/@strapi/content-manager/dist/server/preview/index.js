'use strict';

var index = require('./routes/index.js');
var index$1 = require('./controllers/index.js');
var index$2 = require('./services/index.js');
var utils = require('./utils.js');

/**
 * Check once if the feature is enabled before loading it,
 * so that we can assume it is enabled in the other files.
 */ const getFeature = ()=>{
    return {
        register () {
            const config = utils.getService(strapi, 'preview-config');
            config.validate();
            config.register();
        },
        bootstrap () {},
        routes: index.routes,
        controllers: index$1.controllers,
        services: index$2.services
    };
};
var preview = getFeature();

module.exports = preview;
//# sourceMappingURL=index.js.map
