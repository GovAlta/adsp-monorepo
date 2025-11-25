'use strict';

var reviewWorkflows = require('./review-workflows.js');
var index = require('../homepage/index.js');

var routes = {
    'review-workflows': reviewWorkflows,
    ...index.routes
};

module.exports = routes;
//# sourceMappingURL=index.js.map
