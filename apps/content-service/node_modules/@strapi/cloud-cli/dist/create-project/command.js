'use strict';

var commander = require('commander');
var helpers = require('../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ create project in Strapi cloud`
 */ const command = ({ ctx })=>{
    return commander.createCommand('cloud:create-project').description('Create a Strapi Cloud project').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('cloud:create-project', action)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
