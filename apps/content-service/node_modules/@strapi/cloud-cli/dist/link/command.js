'use strict';

var helpers = require('../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ link local directory to project of the cloud`
 */ const command = ({ command, ctx })=>{
    command.command('cloud:link').alias('link').description('Link a local directory to a Strapi Cloud project').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('link', action)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
