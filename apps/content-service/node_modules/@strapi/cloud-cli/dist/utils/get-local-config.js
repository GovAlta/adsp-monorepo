'use strict';

var chalk = require('chalk');
require('axios');
require('fs-extra');
require('os');
require('../config/api.js');
require('path');
require('xdg-app-paths');
var strapiInfoSave = require('../services/strapi-info-save.js');
require('jwks-rsa');
require('jsonwebtoken');
require('fast-safe-stringify');
require('ora');
require('cli-progress');

async function getLocalConfig(ctx) {
    try {
        return await strapiInfoSave.retrieve();
    } catch (e) {
        ctx.logger.debug('Failed to get project config', e);
        ctx.logger.error('An error occurred while retrieving config data from your local project.');
        return null;
    }
}
async function getLocalProject(ctx) {
    const localConfig = await getLocalConfig(ctx);
    if (!localConfig || !localConfig.project) {
        ctx.logger.warn(`\nWe couldn't find a valid local project config.\nPlease link your local project to an existing Strapi Cloud project using the ${chalk.cyan('link')} command.`);
        process.exit(1);
    }
    return localConfig.project;
}

exports.getLocalConfig = getLocalConfig;
exports.getLocalProject = getLocalProject;
//# sourceMappingURL=get-local-config.js.map
