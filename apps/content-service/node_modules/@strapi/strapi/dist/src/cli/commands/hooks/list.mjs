import { createCommand } from 'commander';
import CLITable from 'cli-table3';
import chalk from 'chalk';
import { compileStrapi, createStrapi } from '@strapi/core';
import { runAction } from '../../utils/helpers.mjs';

const action = async ()=>{
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).register();
    const list = app.get('hooks').keys();
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
 * `$ strapi hooks:list`
 */ const command = ()=>{
    return createCommand('hooks:list').description('List all the application hooks').action(runAction('hooks:list', action));
};

export { action, command };
//# sourceMappingURL=list.mjs.map
