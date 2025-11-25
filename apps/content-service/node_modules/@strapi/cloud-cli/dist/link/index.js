'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var link = {
    name: 'link-project',
    description: 'Link a local directory to a Strapi Cloud project',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = link;
//# sourceMappingURL=index.js.map
