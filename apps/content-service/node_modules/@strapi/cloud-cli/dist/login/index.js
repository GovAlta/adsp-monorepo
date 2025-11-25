'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var login = {
    name: 'login',
    description: 'Strapi Cloud Login',
    action: action.default,
    command
};

exports.action = action.default;
exports.command = command;
exports.default = login;
//# sourceMappingURL=index.js.map
