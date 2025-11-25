'use strict';

var helpers = require('../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ list project from the cloud`
 */ const command = ({ command, ctx })=>{
    command.command('cloud:projects').alias('projects').description('List Strapi Cloud projects').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('projects', action)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
