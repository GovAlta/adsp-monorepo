'use strict';

var workflows = require('./workflows.js');
var stages = require('./stages.js');
var assignees = require('./assignees.js');
var index = require('../homepage/index.js');

var controllers = {
    workflows,
    stages,
    assignees,
    ...index.controllers
};

module.exports = controllers;
//# sourceMappingURL=index.js.map
