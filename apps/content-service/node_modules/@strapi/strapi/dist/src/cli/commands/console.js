'use strict';

var REPL = require('repl');
var commander = require('commander');
var core = require('@strapi/core');
var helpers = require('../utils/helpers.js');

const action = async ()=>{
    const appContext = await core.compileStrapi();
    const app = await core.createStrapi(appContext).load();
    app.start().then(()=>{
        const repl = REPL.start(app.config.info.name + ' > ' || 'strapi > '); // eslint-disable-line prefer-template
        repl.on('exit', (err)=>{
            if (err) {
                app.log.error(err);
                process.exit(1);
            }
            app.server.destroy();
            process.exit(0);
        });
    });
};
/**
 * `$ strapi console`
 */ const command = ()=>{
    return commander.createCommand('console').description('Open the Strapi framework console').action(helpers.runAction('console', action));
};

exports.action = action;
exports.command = command;
//# sourceMappingURL=console.js.map
