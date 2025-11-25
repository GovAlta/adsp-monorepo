'use strict';

var commander = require('commander');
var os = require('os');
var core = require('@strapi/core');
var helpers = require('../utils/helpers.js');

const action = async ({ uuid, dependencies, all })=>{
    const config = {
        reportUUID: Boolean(all || uuid),
        reportDependencies: Boolean(all || dependencies)
    };
    const appContext = await core.compileStrapi();
    const app = await core.createStrapi(appContext).register();
    let debugInfo = `Launched In: ${Date.now() - app.config.launchedAt} ms
Environment: ${app.config.environment}
OS: ${process.platform}-${process.arch}
Strapi Version: ${app.config.info.strapi}
Node/Yarn Version: ${process.env.npm_config_user_agent}
Edition: ${app.EE ? 'Enterprise' : 'Community'}
Database: ${app?.config?.database?.connection?.client ?? 'unknown'}`;
    if (config.reportUUID) {
        debugInfo += `${os.EOL}UUID: ${app.config.uuid}`;
    }
    if (config.reportDependencies) {
        debugInfo += `${os.EOL}Dependencies: ${JSON.stringify(app.config.info.dependencies, null, 2)}
Dev Dependencies: ${JSON.stringify(app.config.info.devDependencies, null, 2)}`;
    }
    console.log(debugInfo);
    await app.destroy();
};
/**
 * `$ strapi report`
 */ const command = ()=>{
    return commander.createCommand('report').description('Get system stats for debugging and submitting issues').option('-u, --uuid', 'Include Project UUID').option('-d, --dependencies', 'Include Project Dependencies').option('--all', 'Include All Information').action(helpers.runAction('report', action));
};

exports.command = command;
//# sourceMappingURL=report.js.map
