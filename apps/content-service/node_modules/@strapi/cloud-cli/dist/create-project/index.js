'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var createProject = {
    name: 'create-project',
    description: 'Create a new project',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = createProject;
//# sourceMappingURL=index.js.map
