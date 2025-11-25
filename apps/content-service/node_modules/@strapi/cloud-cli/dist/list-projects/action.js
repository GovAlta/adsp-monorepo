'use strict';

var cliApi = require('../services/cli-api.js');
require('fs-extra');
require('path');
require('lodash');
var token = require('../services/token.js');
require('chalk');
require('fast-safe-stringify');
require('ora');
require('cli-progress');
var action$1 = require('../login/action.js');

var action = (async (ctx)=>{
    const { getValidToken } = await token.tokenServiceFactory(ctx);
    const token$1 = await getValidToken(ctx, action$1.promptLogin);
    const { logger } = ctx;
    if (!token$1) {
        return;
    }
    const cloudApiService = await cliApi.cloudApiFactory(ctx, token$1);
    const spinner = logger.spinner('Fetching your projects...').start();
    try {
        const { data: { data: projectList } } = await cloudApiService.listProjects();
        spinner.succeed();
        logger.log(projectList);
    } catch (e) {
        ctx.logger.debug('Failed to list projects', e);
        spinner.fail('An error occurred while fetching your projects from Strapi Cloud.');
    }
});

module.exports = action;
//# sourceMappingURL=action.js.map
