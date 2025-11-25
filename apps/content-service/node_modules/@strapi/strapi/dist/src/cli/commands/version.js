'use strict';

var commander = require('commander');
var _package = require('../../../package.json.js');

/**
 * `$ strapi version`
 */ const command = ()=>{
    // load the Strapi package.json to get version and other information
    return commander.createCommand('version').description('Output the version of Strapi').action(()=>{
        process.stdout.write(`${_package.version}\n`);
        process.exit(0);
    });
};

exports.command = command;
//# sourceMappingURL=version.js.map
