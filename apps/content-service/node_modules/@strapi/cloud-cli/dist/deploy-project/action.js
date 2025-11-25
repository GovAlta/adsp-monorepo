'use strict';

var fse = require('fs-extra');
var inquirer = require('inquirer');
var boxen = require('boxen');
var path = require('path');
var chalk = require('chalk');
var axios = require('axios');
var crypto = require('node:crypto');
var api = require('../config/api.js');
var compressFiles = require('../utils/compress-files.js');
var action$2 = require('../create-project/action.js');
var local = require('../config/local.js');
var cliApi = require('../services/cli-api.js');
var strapiInfoSave = require('../services/strapi-info-save.js');
var token = require('../services/token.js');
require('fast-safe-stringify');
require('ora');
require('cli-progress');
var notification = require('../services/notification.js');
var pkg = require('../utils/pkg.js');
var buildLogs = require('../services/build-logs.js');
var action$1 = require('../login/action.js');
var analytics = require('../utils/analytics.js');
var errorMessageFactories = require('../utils/error-message-factories.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var crypto__namespace = /*#__PURE__*/_interopNamespaceDefault(crypto);

const boxenOptions = {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'yellow',
    borderStyle: 'round'
};
const QUIT_OPTION = 'Quit';
async function promptForEnvironment(environments) {
    const choices = environments.map((env)=>({
            name: env,
            value: env
        }));
    const { selectedEnvironment } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedEnvironment',
            message: 'Select the environment to deploy:',
            choices: [
                ...choices,
                {
                    name: chalk.grey(`(${QUIT_OPTION})`),
                    value: null
                }
            ]
        }
    ]);
    if (selectedEnvironment === null) {
        process.exit(1);
    }
    return selectedEnvironment;
}
async function upload(ctx, project, cliConfig, token, maxProjectFileSize) {
    const cloudApi = await cliApi.cloudApiFactory(ctx, token);
    try {
        const storagePath = await local.getTmpStoragePath();
        const projectFolder = path.resolve(process.cwd());
        const packageJson = await pkg.loadPkg(ctx);
        if (!packageJson) {
            ctx.logger.error('Unable to deploy the project. Please make sure the package.json file is correctly formatted.');
            return;
        }
        const compressSpinner = ctx.logger.spinner('Compressing project...').start();
        compressSpinner.indent = 1;
        // hash packageJson.name to avoid conflicts
        const hashname = crypto__namespace.createHash('sha512').update(packageJson.name).digest('hex');
        const compressedFilename = `${hashname}.tar.gz`;
        try {
            ctx.logger.debug('Compression parameters\n', `Storage path: ${storagePath}\n`, `Project folder: ${projectFolder}\n`, `Compressed filename: ${compressedFilename}`);
            await compressFiles.compressFilesToTar(storagePath, projectFolder, compressedFilename);
            compressSpinner.succeed(`Project compressed successfully!`);
        } catch (e) {
            compressSpinner.fail('Project compression failed. Try again later or check for large/incompatible files.');
            ctx.logger.debug(e);
            process.exit(1);
        }
        const tarFilePath = path.resolve(storagePath, compressedFilename);
        const fileStats = await fse.stat(tarFilePath);
        if (fileStats.size > maxProjectFileSize) {
            ctx.logger.log('Unable to proceed: Your project is too big to be transferred, please use a git repo instead.');
            try {
                await fse.remove(tarFilePath);
            } catch (e) {
                ctx.logger.log('Unable to remove file: ', tarFilePath);
                ctx.logger.debug(e);
            }
            return;
        }
        const progressBar = ctx.logger.progressBar(100, ' ∷ Uploading project');
        try {
            const { data } = await cloudApi.deploy({
                filePath: tarFilePath,
                project
            }, {
                onUploadProgress (progressEvent) {
                    const total = progressEvent.total || fileStats.size;
                    const percentage = Math.round(progressEvent.loaded * 100 / total);
                    progressBar.update(percentage);
                }
            });
            progressBar.update(100);
            progressBar.stop();
            ctx.logger.log(`${chalk.green.bold('✔')} Upload finished!\n`);
            return data.build_id;
        } catch (e) {
            progressBar.stop();
            await handleUploadError(ctx, e, project, cliConfig);
        } finally{
            await fse.remove(tarFilePath);
        }
        process.exit(0);
    } catch (e) {
        ctx.logger.error('An error occurred while deploying the project. Please try again later.');
        ctx.logger.debug(e);
        process.exit(1);
    }
}
async function handleUploadError(ctx, error, project, cliConfig) {
    const { logger } = ctx;
    logger.debug(error);
    if (error.response?.status) {
        switch(error.response.status){
            case 405:
                {
                    const environmentErrorMessage = errorMessageFactories.environmentErrorMessageFactory({
                        projectName: project.name,
                        firstLine: cliConfig.projectDeployment.errors.environmentNotReady.firstLine,
                        secondLine: cliConfig.projectDeployment.errors.environmentNotReady.secondLine
                    });
                    logger.log(errorMessageFactories.environmentCreationErrorFactory(environmentErrorMessage));
                    return;
                }
            case 413:
                logger.error('The project you are trying to upload is too big. Please remove unnecessary files and try again.');
                return;
        }
    }
    logger.error('An error occurred while deploying the project. Please try again later.');
}
async function getProject(ctx) {
    const { project } = await strapiInfoSave.retrieve();
    if (!project) {
        try {
            const projectResponse = await action$2(ctx);
            if (projectResponse) {
                const { project: projectSaved } = await strapiInfoSave.retrieve();
                return projectSaved;
            }
        } catch (e) {
            ctx.logger.error('An error occurred while deploying the project. Please try again later.');
            ctx.logger.debug(e);
            process.exit(1);
        }
    }
    return project;
}
async function getConfig({ ctx, cloudApiService }) {
    try {
        const { data: cliConfig } = await cloudApiService.config();
        return cliConfig;
    } catch (e) {
        ctx.logger.debug('Failed to get cli config', e);
        return null;
    }
}
function validateEnvironment(ctx, environment, environments) {
    if (!environments.includes(environment)) {
        ctx.logger.error(`Environment ${environment} does not exist.`);
        process.exit(1);
    }
}
async function getTargetEnvironment(ctx, opts, project, environments) {
    if (opts.env) {
        validateEnvironment(ctx, opts.env, environments);
        return opts.env;
    }
    if (project.targetEnvironment) {
        return project.targetEnvironment;
    }
    if (environments.length > 1) {
        return promptForEnvironment(environments);
    }
    return environments[0];
}
function hasPendingOrLiveDeployment(environments, targetEnvironment) {
    const environment = environments.find((env)=>env.name === targetEnvironment);
    if (!environment) {
        throw new Error(`Environment details ${targetEnvironment} not found.`);
    }
    return environment.hasPendingDeployment || environment.hasLiveDeployment || false;
}
var action = (async (ctx, opts)=>{
    const { getValidToken } = await token.tokenServiceFactory(ctx);
    const token$1 = await getValidToken(ctx, action$1.promptLogin);
    if (!token$1) {
        return;
    }
    const project = await getProject(ctx);
    if (!project) {
        process.exit(1);
    }
    const cloudApiService = await cliApi.cloudApiFactory(ctx, token$1);
    let projectData;
    let environments;
    let environmentsDetails;
    try {
        const { data: { data, metadata } } = await cloudApiService.getProject({
            name: project.name
        });
        projectData = data;
        environments = projectData.environments;
        environmentsDetails = projectData.environmentsDetails;
        const isProjectSuspended = projectData.suspendedAt;
        if (isProjectSuspended) {
            ctx.logger.log('\n Oops! This project has been suspended. \n\n Please reactivate it from the dashboard to continue deploying: ');
            ctx.logger.log(chalk.underline(`${metadata.dashboardUrls.project}`));
            return;
        }
    } catch (e) {
        if (e instanceof axios.AxiosError && e.response?.data) {
            if (e.response.status === 404) {
                ctx.logger.warn(`The project associated with this folder does not exist in Strapi Cloud. \nPlease link your local project to an existing Strapi Cloud project using the ${chalk.cyan('link')} command before deploying.`);
            } else {
                ctx.logger.error(e.response.data);
            }
        } else {
            ctx.logger.error("An error occurred while retrieving the project's information. Please try again later.");
        }
        ctx.logger.debug(e);
        return;
    }
    await analytics.trackEvent(ctx, cloudApiService, 'willDeployWithCLI', {
        projectInternalName: project.name
    });
    const notificationService = notification.notificationServiceFactory(ctx);
    const buildLogsService = buildLogs.buildLogsServiceFactory(ctx);
    const cliConfig = await getConfig({
        ctx,
        cloudApiService
    });
    if (!cliConfig) {
        ctx.logger.error('An error occurred while retrieving data from Strapi Cloud. Please check your network or try again later.');
        return;
    }
    let maxSize = parseInt(cliConfig.maxProjectFileSize, 10);
    if (Number.isNaN(maxSize)) {
        ctx.logger.debug('An error occurred while parsing the maxProjectFileSize. Using default value.');
        maxSize = 100000000;
    }
    project.targetEnvironment = await getTargetEnvironment(ctx, opts, project, environments);
    if (!opts.force) {
        const shouldDisplayWarning = hasPendingOrLiveDeployment(environmentsDetails, project.targetEnvironment);
        if (shouldDisplayWarning) {
            ctx.logger.log(boxen(cliConfig.projectDeployment.confirmationText, boxenOptions));
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Do you want to proceed with deployment to ${chalk.cyan(projectData.displayName)} on ${chalk.cyan(project.targetEnvironment)} environment?`
                }
            ]);
            if (!confirm) {
                process.exit(1);
            }
        }
    }
    const buildId = await upload(ctx, project, cliConfig, token$1, maxSize);
    if (!buildId) {
        return;
    }
    let notifications = null;
    try {
        ctx.logger.log(`∷ Deploying project to ${chalk.cyan(project.targetEnvironment ?? `production`)} environment...`);
        notifications = notificationService(`${api.apiConfig.apiBaseUrl}/${cliApi.VERSION}/notifications`, token$1, cliConfig);
        await buildLogsService(`${api.apiConfig.apiBaseUrl}/${cliApi.VERSION}/logs/${buildId}`, token$1, cliConfig);
        const dashboardUrlLine = chalk.cyan(' →  ') + chalk.cyan.underline(`${api.apiConfig.dashboardBaseUrl}/projects/${project.name}/deployments`);
        ctx.logger.log(boxen(`Project and deployment logs ready at:\n${dashboardUrlLine}`, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'white',
            titleAlignment: 'left'
        }));
    } catch (e) {
        ctx.logger.debug(e);
        if (e instanceof Error) {
            ctx.logger.error(e.message);
        } else {
            ctx.logger.error('An error occurred while deploying the project. Please try again later.');
        }
    } finally{
        if (notifications) {
            notifications.close();
        }
    }
});

module.exports = action;
//# sourceMappingURL=action.js.map
