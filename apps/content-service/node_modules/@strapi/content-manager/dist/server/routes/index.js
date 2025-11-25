'use strict';

var admin = require('./admin.js');
var index = require('../history/index.js');
var index$1 = require('../preview/index.js');
var index$2 = require('../homepage/index.js');

var routes = {
    admin,
    ...index.routes ? index.routes : {},
    ...index$1.routes ? index$1.routes : {},
    ...index$2.routes
};

module.exports = routes;
//# sourceMappingURL=index.js.map
