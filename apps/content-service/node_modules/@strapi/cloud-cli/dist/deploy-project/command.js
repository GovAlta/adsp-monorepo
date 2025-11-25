'use strict';

var commander = require('commander');
var helpers = require('../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ deploy project to the cloud`
 */ const command = ({ ctx })=>{
    return commander.createCommand('cloud:deploy').alias('deploy').description('Deploy a Strapi Cloud project').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").option('-f, --force', 'Skip confirmation to deploy').option('-e, --env <name>', 'Specify the environment to deploy').action((opts)=>helpers.runAction('deploy', action)(ctx, opts));
};

module.exports = command;
//# sourceMappingURL=command.js.map
