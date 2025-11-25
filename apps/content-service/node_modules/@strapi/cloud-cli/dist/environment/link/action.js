'use strict';

var chalk = require('chalk');
var inquirer = require('inquirer');
var cliApi = require('../../services/cli-api.js');
var strapiInfoSave = require('../../services/strapi-info-save.js');
var token = require('../../services/token.js');
require('fast-safe-stringify');
require('ora');
require('cli-progress');
var action$1 = require('../../login/action.js');
var analytics = require('../../utils/analytics.js');
var getLocalConfig = require('../../utils/get-local-config.js');

const QUIT_OPTION = 'Quit';
var action = (async (ctx)=>{
    const { getValidToken } = await token.tokenServiceFactory(ctx);
    const token$1 = await getValidToken(ctx, action$1.promptLogin);
    const { logger } = ctx;
    if (!token$1) {
        return;
    }
    const project = await getLocalConfig.getLocalProject(ctx);
    if (!project) {
        logger.debug(`No valid local project configuration was found.`);
        return;
    }
    const cloudApiService = await cliApi.cloudApiFactory(ctx, token$1);
    const environments = await getEnvironmentsList(ctx, cloudApiService, project);
    if (!environments) {
        logger.debug(`Fetching environments failed.`);
        return;
    }
    if (environments.length === 0) {
        logger.log(`The only available environment is already linked. You can add a new one from your project settings on the Strapi Cloud dashboard.`);
        return;
    }
    const answer = await promptUserForEnvironment(ctx, environments);
    if (!answer) {
        return;
    }
    await analytics.trackEvent(ctx, cloudApiService, 'willLinkEnvironment', {
        projectName: project.name,
        environmentName: answer.targetEnvironment
    });
    try {
        await strapiInfoSave.patch({
            project: {
                targetEnvironment: answer.targetEnvironment
            }
        });
    } catch (e) {
        await analytics.trackEvent(ctx, cloudApiService, 'didNotLinkEnvironment', {
            projectName: project.name,
            environmentName: answer.targetEnvironment
        });
        logger.debug('Failed to link environment', e);
        logger.error('Failed to link the environment. If this issue persists, try re-linking your project or contact support.');
        process.exit(1);
    }
    logger.log(` You have successfully linked your project to ${chalk.cyan(answer.targetEnvironment)}, on ${chalk.cyan(project.displayName)}. You are now able to deploy your project.`);
    await analytics.trackEvent(ctx, cloudApiService, 'didLinkEnvironment', {
        projectName: project.name,
        environmentName: answer.targetEnvironment
    });
});
async function promptUserForEnvironment(ctx, environments) {
    const { logger } = ctx;
    try {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'targetEnvironment',
                message: 'Which environment do you want to link?',
                choices: [
                    ...environments,
                    {
                        name: chalk.grey(`(${QUIT_OPTION})`),
                        value: null
                    }
                ]
            }
        ]);
        if (!answer.targetEnvironment) {
            return null;
        }
        return answer;
    } catch (e) {
        logger.debug('Failed to get user input', e);
        logger.error('An error occurred while trying to get your environment selection.');
        return null;
    }
}
async function getEnvironmentsList(ctx, cloudApiService, project) {
    const spinner = ctx.logger.spinner('Fetching environments...\n').start();
    try {
        const { data: { data: environmentsList } } = await cloudApiService.listLinkEnvironments({
            name: project.name
        });
        if (!Array.isArray(environmentsList) || environmentsList.length === 0) {
            throw new Error('Environments not found in server response');
        }
        spinner.succeed();
        return environmentsList.filter((environment)=>environment.name !== project.targetEnvironment);
    } catch (e) {
        if (e.response && e.response.status === 404) {
            spinner.succeed();
            ctx.logger.warn(`\nThe project associated with this folder does not exist in Strapi Cloud. \nPlease link your local project to an existing Strapi Cloud project using the ${chalk.cyan('link')} command.`);
        } else {
            spinner.fail('An error occurred while fetching environments data from Strapi Cloud.');
            ctx.logger.debug('Failed to list environments', e);
        }
    }
}

module.exports = action;
//# sourceMappingURL=action.js.map
