'use strict';

var register = require('./register.js');
var index$1 = require('./content-types/index.js');
var bootstrap = require('./bootstrap.js');
var destroy = require('./destroy.js');
var index$4 = require('./routes/index.js');
var index$2 = require('./services/index.js');
var index$3 = require('./controllers/index.js');

const getPlugin = ()=>{
    if (strapi.ee.features.isEnabled('review-workflows')) {
        return {
            register,
            bootstrap,
            destroy,
            contentTypes: index$1,
            services: index$2,
            controllers: index$3,
            routes: index$4
        };
    }
    return {
        // Always return contentTypes to avoid losing data when the feature is disabled
        // or downgrading the license
        contentTypes: index$1
    };
};
var index = getPlugin();

module.exports = index;
//# sourceMappingURL=index.js.map
