'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var action = require('./action.js');
var command = require('./command.js');

var linkEnvironment = {
    name: 'link-environment',
    description: 'Link Strapi Cloud environment to a local project',
    action,
    command
};

exports.action = action;
exports.command = command;
exports.default = linkEnvironment;
//# sourceMappingURL=index.js.map
