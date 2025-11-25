'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var logout = {
    name: 'logout',
    description: 'Strapi Cloud Logout',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = logout;
//# sourceMappingURL=index.js.map
