'use strict';

var chalk = require('chalk');
var cliApi = require('../../services/cli-api.js');
require('fs-extra');
require('path');
require('lodash');
var token = require('../../services/token.js');
require('fast-safe-stringify');
require('ora');
require('cli-progress');
var action$1 = require('../../login/action.js');
var analytics = require('../../utils/analytics.js');
var getLocalConfig = require('../../utils/get-local-config.js');

var action = (async (ctx)=>{
    const { getValidToken } = await token.tokenServiceFactory(ctx);
    const token$1 = await getValidToken(ctx, action$1.promptLogin);
    const { logger } = ctx;
    if (!token$1) {
        return;
    }
    const project = await getLocalConfig.getLocalProject(ctx);
    if (!project) {
        ctx.logger.debug(`No valid local project configuration was found.`);
        return;
    }
    const cloudApiService = await cliApi.cloudApiFactory(ctx, token$1);
    const spinner = logger.spinner('Fetching environments...').start();
    await analytics.trackEvent(ctx, cloudApiService, 'willListEnvironment', {
        projectInternalName: project.name
    });
    try {
        const { data: { data: environmentsList } } = await cloudApiService.listEnvironments({
            name: project.name
        });
        spinner.succeed();
        logger.log(environmentsList);
        await analytics.trackEvent(ctx, cloudApiService, 'didListEnvironment', {
            projectInternalName: project.name
        });
    } catch (e) {
        if (e.response && e.response.status === 404) {
            spinner.succeed();
            logger.warn(`\nThe project associated with this folder does not exist in Strapi Cloud. \nPlease link your local project to an existing Strapi Cloud project using the ${chalk.cyan('link')} command`);
        } else {
            spinner.fail('An error occurred while fetching environments data from Strapi Cloud.');
            logger.debug('Failed to list environments', e);
        }
        await analytics.trackEvent(ctx, cloudApiService, 'didNotListEnvironment', {
            projectInternalName: project.name
        });
    }
});

module.exports = action;
//# sourceMappingURL=action.js.map
