'use strict';

var history = require('./history.js');
var lifecycles = require('./lifecycles.js');

const services = {
    history: history.createHistoryService,
    lifecycles: lifecycles.createLifecyclesService
};

exports.services = services;
//# sourceMappingURL=index.js.map
