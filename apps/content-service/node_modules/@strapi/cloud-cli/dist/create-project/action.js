'use strict';

var inquirer = require('inquirer');
var axios = require('axios');
var fp = require('lodash/fp');
var cliApi = require('../services/cli-api.js');
var strapiInfoSave = require('../services/strapi-info-save.js');
var token = require('../services/token.js');
require('chalk');
require('fast-safe-stringify');
require('ora');
require('cli-progress');
var getProjectNameFromPkg = require('./utils/get-project-name-from-pkg.js');
var action$1 = require('../login/action.js');
var projectQuestions_utils = require('./utils/project-questions.utils.js');
var api = require('../config/api.js');
var notification = require('../services/notification.js');
var errorMessageFactories = require('../utils/error-message-factories.js');

async function handleError(ctx, error) {
    const { logger } = ctx;
    logger.debug(error);
    if (error instanceof axios.AxiosError) {
        const errorMessage = typeof error.response?.data === 'string' ? error.response.data : null;
        switch(error.response?.status){
            case 400:
                logger.error(errorMessage || 'Invalid input. Please check your inputs and try again.');
                return;
            case 403:
                logger.error(errorMessage || 'You do not have permission to create a project. Please contact support for assistance.');
                return;
            case 503:
                logger.error('Strapi Cloud project creation is currently unavailable. Please try again later.');
                return;
            default:
                if (errorMessage) {
                    logger.error(errorMessage);
                    throw error;
                }
                break;
        }
    }
    logger.error('We encountered an issue while creating your project. Please try again in a moment. If the problem persists, contact support for assistance.');
}
async function createProject(ctx, cloudApi, projectInput, token, config) {
    const { logger } = ctx;
    const projectSpinner = logger.spinner('Setting up your project...').start();
    projectSpinner.indent = 1;
    const notificationService = notification.notificationServiceFactory(ctx);
    const { waitForEnvironmentCreation, close } = notificationService(`${api.apiConfig.apiBaseUrl}/${cliApi.VERSION}/notifications`, token, config);
    let projectData;
    try {
        const { data } = await cloudApi.createProject(projectInput);
        projectData = data;
        await strapiInfoSave.save({
            project: data
        });
        projectSpinner.succeed('Project created successfully!');
    } catch (e) {
        projectSpinner.fail(`An error occurred while creating the project on Strapi Cloud.`);
        close();
        throw e;
    }
    if (config.featureFlags.asyncProjectCreationEnabled) {
        const environmentSpinner = logger.spinner('Setting up your environment... This may take a minute...').start();
        environmentSpinner.indent = 1;
        try {
            await waitForEnvironmentCreation(projectData.environmentInternalName);
            environmentSpinner.succeed('Environment created successfully!\n');
        } catch (e) {
            environmentSpinner.fail(`An error occurred while creating the environment on Strapi Cloud.\n`);
            const environmentErrorMessage = errorMessageFactories.environmentErrorMessageFactory({
                projectName: projectData.name,
                firstLine: config.projectCreation.errors.environmentCreationFailed.firstLine,
                secondLine: config.projectCreation.errors.environmentCreationFailed.secondLine
            });
            logger.log(errorMessageFactories.environmentCreationErrorFactory(environmentErrorMessage));
            return;
        }
    }
    close();
    return projectData;
}
var action = (async (ctx)=>{
    const { logger } = ctx;
    const { getValidToken, eraseToken } = await token.tokenServiceFactory(ctx);
    const token$1 = await getValidToken(ctx, action$1.promptLogin);
    if (!token$1) {
        return;
    }
    const cloudApi = await cliApi.cloudApiFactory(ctx, token$1);
    const { data: config } = await cloudApi.config();
    const projectName = await getProjectNameFromPkg.getProjectNameFromPackageJson(ctx);
    const defaultAnswersMapper = projectQuestions_utils.questionDefaultValuesMapper({
        name: projectName,
        nodeVersion: projectQuestions_utils.getProjectNodeVersionDefault
    });
    const questions = defaultAnswersMapper(config.projectCreation.questions);
    const defaultValues = {
        ...config.projectCreation.defaults,
        ...projectQuestions_utils.getDefaultsFromQuestions(questions)
    };
    const projectAnswersDefaulted = fp.defaults(defaultValues);
    const projectAnswers = await inquirer.prompt(questions);
    const projectInput = projectAnswersDefaulted(projectAnswers);
    try {
        return await createProject(ctx, cloudApi, projectInput, token$1, config);
    } catch (e) {
        if (e instanceof axios.AxiosError && e.response?.status === 401) {
            logger.warn('Oops! Your session has expired. Please log in again to retry.');
            await eraseToken();
            if (await action$1.promptLogin(ctx)) {
                return await createProject(ctx, cloudApi, projectInput, token$1, config);
            }
        } else {
            await handleError(ctx, e);
        }
    }
});

module.exports = action;
//# sourceMappingURL=action.js.map
