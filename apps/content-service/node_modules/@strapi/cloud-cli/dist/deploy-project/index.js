'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var deployProject = {
    name: 'deploy-project',
    description: 'Deploy a Strapi Cloud project',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = deployProject;
//# sourceMappingURL=index.js.map
