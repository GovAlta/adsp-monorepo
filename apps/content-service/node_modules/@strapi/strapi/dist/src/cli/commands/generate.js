'use strict';

var commander = require('commander');
var helpers = require('../utils/helpers.js');

/**
 * `$ strapi generate`
 */ const command = ({ argv })=>{
    return commander.createCommand('generate').description('Launch the interactive API generator').action(()=>{
        helpers.assertCwdContainsStrapiProject('generate');
        argv.splice(2, 1);
        // NOTE: this needs to be lazy loaded in order for plop to work correctly
        import('@strapi/generators').then((gen)=>gen.runCLI());
    });
};

exports.command = command;
//# sourceMappingURL=generate.js.map
