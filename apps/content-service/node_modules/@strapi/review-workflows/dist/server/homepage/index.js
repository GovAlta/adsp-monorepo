'use strict';

var index = require('./routes/index.js');
var index$1 = require('./controllers/index.js');
var index$2 = require('./services/index.js');

var homepage = {
    routes: index.routes,
    controllers: index$1.controllers,
    services: index$2.services
};

module.exports = homepage;
//# sourceMappingURL=index.js.map
