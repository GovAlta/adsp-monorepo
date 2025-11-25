'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var listProjects = {
    name: 'list-projects',
    description: 'List Strapi Cloud projects',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = listProjects;
//# sourceMappingURL=index.js.map
