import { createCommand } from 'commander';
import CLITable from 'cli-table3';
import chalk from 'chalk';
import { toUpper } from 'lodash/fp';
import { compileStrapi, createStrapi } from '@strapi/core';
import { runAction } from '../../utils/helpers.mjs';

const action = async ()=>{
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();
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
            route.methods.map(toUpper).join('|'),
            route.path
        ]);
    });
    console.log(infoTable.toString());
    await app.destroy();
};
/**
 * `$ strapi routes:list``
 */ const command = ()=>{
    return createCommand('routes:list').description('List all the application routes').action(runAction('routes:list', action));
};

export { action, command };
//# sourceMappingURL=list.mjs.map
