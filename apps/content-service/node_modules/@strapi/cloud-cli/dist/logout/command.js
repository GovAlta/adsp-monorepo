'use strict';

var commander = require('commander');
var helpers = require('../utils/helpers.js');
var action = require('./action.js');

/**
 * `$ cloud device flow logout`
 */ const command = ({ ctx })=>{
    return commander.createCommand('cloud:logout').alias('logout').description('Strapi Cloud Logout').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>helpers.runAction('logout', action)(ctx));
};

module.exports = command;
//# sourceMappingURL=command.js.map
