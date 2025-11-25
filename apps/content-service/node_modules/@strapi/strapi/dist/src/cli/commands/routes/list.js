'use strict';

var commander = require('commander');
var CLITable = require('cli-table3');
var chalk = require('chalk');
var fp = require('lodash/fp');
var core = require('@strapi/core');
var helpers = require('../../utils/helpers.js');

const action = async ()=>{
    const appContext = await core.compileStrapi();
    const app = await core.createStrapi(appContext).load();
    const list = app.server.mount().listRoutes();
    const infoTable = new CLITable({
        head: [
            chalk.blue('Method'),
            chalk.blue('Path')
        ],
        colWidths: [
            20
        ]
    });
    list.filter((route)=>route.methods.length).forEach((route)=>{
        infoTable.push([
            route.methods.map(fp.toUpper).join('|'),
            route.path
        ]);
    });
    console.log(infoTable.toString());
    await app.destroy();
};
/**
 * `$ strapi routes:list``
 */ const command = ()=>{
    return commander.createCommand('routes:list').description('List all the application routes').action(helpers.runAction('routes:list', action));
};

exports.action = action;
exports.command = command;
//# sourceMappingURL=list.js.map
