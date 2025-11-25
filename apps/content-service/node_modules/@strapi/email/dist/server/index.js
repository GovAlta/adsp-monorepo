'use strict';

var bootstrap = require('./bootstrap.js');
var index$1 = require('./services/index.js');
var index$2 = require('./routes/index.js');
var index$3 = require('./controllers/index.js');
var config = require('./config.js');
var index$4 = require('./middlewares/index.js');

var index = {
    bootstrap: bootstrap.bootstrap,
    services: index$1.services,
    routes: index$2.routes,
    controllers: index$3.controllers,
    config: config.config,
    middlewares: index$4.default
};

module.exports = index;
//# sourceMappingURL=index.js.map
