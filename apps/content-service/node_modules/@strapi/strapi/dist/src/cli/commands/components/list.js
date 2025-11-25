'use strict';

var commander = require('commander');
var CLITable = require('cli-table3');
var chalk = require('chalk');
var core = require('@strapi/core');
var helpers = require('../../utils/helpers.js');

const action = async ()=>{
    const appContext = await core.compileStrapi();
    const app = await core.createStrapi(appContext).register();
    const list = Object.keys(app.components);
    const infoTable = new CLITable({
        head: [
            chalk.blue('Name')
        ]
    });
    list.forEach((name)=>infoTable.push([
            name
        ]));
    console.log(infoTable.toString());
    await app.destroy();
};
/**
 * `$ strapi components:list`
 */ const command = ()=>{
    return commander.createCommand('components:list').description('List all the application components').action(helpers.runAction('components:list', action));
};

exports.action = action;
exports.command = command;
//# sourceMappingURL=list.js.map
