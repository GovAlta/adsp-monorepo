'use strict';

var commander = require('commander');
var helpers = require('../../utils/helpers.js');
var generate = require('./generate.js');

/**
 * `$ strapi openapi`
 */ const command = ()=>{
    const openapi = commander.createCommand('openapi').description('Manage OpenAPI specifications for your Strapi application');
    // `$ strapi openapi generate [-o, --output <path>]`
    openapi.command('generate').description('Generate an OpenAPI specification for the current Strapi application').option('-o, --output <path>', 'Output file path for the OpenAPI specification').action(helpers.runAction('openapi:generate', generate.action));
    return openapi;
};

exports.command = command;
//# sourceMappingURL=index.js.map
