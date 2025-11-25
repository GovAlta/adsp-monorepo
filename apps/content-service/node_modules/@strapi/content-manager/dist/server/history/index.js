'use strict';

var index = require('./controllers/index.js');
var index$1 = require('./services/index.js');
var index$2 = require('./routes/index.js');
var utils = require('./utils.js');
var historyVersion = require('./models/history-version.js');

/**
 * Check once if the feature is enabled before loading it,
 * so that we can assume it is enabled in the other files.
 */ const getFeature = ()=>{
    if (strapi.ee.features.isEnabled('cms-content-history')) {
        return {
            register ({ strapi: strapi1 }) {
                strapi1.get('models').add(historyVersion.historyVersion);
            },
            bootstrap ({ strapi: strapi1 }) {
                // Start recording history and saving history versions
                utils.getService(strapi1, 'lifecycles').bootstrap();
            },
            destroy ({ strapi: strapi1 }) {
                utils.getService(strapi1, 'lifecycles').destroy();
            },
            controllers: index.controllers,
            services: index$1.services,
            routes: index$2.routes
        };
    }
    /**
   * Keep registering the model to avoid losing the data if the feature is disabled,
   * or if the license expires.
   */ return {
        register ({ strapi: strapi1 }) {
            strapi1.get('models').add(historyVersion.historyVersion);
        }
    };
};
var history = getFeature();

module.exports = history;
//# sourceMappingURL=index.js.map
