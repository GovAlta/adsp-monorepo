'use strict';

var register = require('./register.js');
var bootstrap = require('./bootstrap.js');
var index$3 = require('./content-types/index.js');
var index$4 = require('./services/index.js');
var index$1 = require('./routes/index.js');
var config = require('./config.js');
var index$2 = require('./controllers/index.js');

var index = (()=>({
        register: register.register,
        bootstrap: bootstrap.bootstrap,
        config: config.config,
        routes: index$1.routes,
        controllers: index$2.controllers,
        contentTypes: index$3.contentTypes,
        services: index$4.services
    }));

module.exports = index;
//# sourceMappingURL=index.js.map
