'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var listEnvironments = {
    name: 'list-environments',
    description: 'List Strapi Cloud environments',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = listEnvironments;
//# sourceMappingURL=index.js.map
