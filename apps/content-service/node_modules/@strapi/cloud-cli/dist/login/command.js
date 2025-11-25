'use strict';

var commander = require('commander');
var helpers = require('../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ cloud device flow login`
 */ const command = ({ ctx })=>{
    return commander.createCommand('cloud:login').alias('login').description('Strapi Cloud Login').addHelpText('after', '\nAfter running this command, you will be prompted to enter your authentication information.').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('login', action.default)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
