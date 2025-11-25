import inquirer from 'inquirer';
import chalk from 'chalk';
import { cloudApiFactory } from '../services/cli-api.mjs';
import { save } from '../services/strapi-info-save.mjs';
import { tokenServiceFactory } from '../services/token.mjs';
import 'fast-safe-stringify';
import 'ora';
import 'cli-progress';
import { promptLogin } from '../login/action.mjs';
import { trackEvent } from '../utils/analytics.mjs';
import { getLocalConfig } from '../utils/get-local-config.mjs';

const QUIT_OPTION = 'Quit';
async function promptForRelink(ctx, cloudApiService, existingConfig) {
    if (existingConfig && existingConfig.project) {
        const { shouldRelink } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldRelink',
                message: `A project named ${chalk.cyan(existingConfig.project.displayName ? existingConfig.project.displayName : existingConfig.project.name)} is already linked to this local folder. Do you want to update the link?`,
                default: false
            }
        ]);
        if (!shouldRelink) {
            await trackEvent(ctx, cloudApiService, 'didNotLinkProject', {
                currentProjectName: existingConfig.project?.name
            });
            return false;
        }
    }
    return true;
}
async function getProjectsList(ctx, cloudApiService, existingConfig) {
    const spinner = ctx.logger.spinner('Fetching your projects...\n').start();
    try {
        const { data: { data: projectList } } = await cloudApiService.listLinkProjects();
        spinner.succeed();
        if (!Array.isArray(projectList)) {
            ctx.logger.log("We couldn't find any projects available for linking in Strapi Cloud.");
            return null;
        }
        const projects = projectList.filter((project)=>!(project.isMaintainer || project.name === existingConfig?.project?.name)).map((project)=>{
            return {
                name: project.displayName,
                value: {
                    name: project.name,
                    displayName: project.displayName
                }
            };
        });
        if (projects.length === 0) {
            ctx.logger.log("We couldn't find any projects available for linking in Strapi Cloud.");
            return null;
        }
        return projects;
    } catch (e) {
        spinner.fail('An error occurred while fetching your projects from Strapi Cloud.');
        ctx.logger.debug('Failed to list projects', e);
        return null;
    }
}
async function getUserSelection(ctx, projects) {
    const { logger } = ctx;
    try {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'linkProject',
                message: 'Which project do you want to link?',
                choices: [
                    ...projects,
                    {
                        name: chalk.grey(`(${QUIT_OPTION})`),
                        value: null
                    }
                ]
            }
        ]);
        if (!answer.linkProject) {
            return null;
        }
        return answer;
    } catch (e) {
        logger.debug('Failed to get user input', e);
        logger.error('An error occurred while trying to get your input.');
        return null;
    }
}
var action = (async (ctx)=>{
    const { getValidToken } = await tokenServiceFactory(ctx);
    const token = await getValidToken(ctx, promptLogin);
    const { logger } = ctx;
    if (!token) {
        return;
    }
    const cloudApiService = await cloudApiFactory(ctx, token);
    const existingConfig = await getLocalConfig(ctx);
    const shouldRelink = await promptForRelink(ctx, cloudApiService, existingConfig);
    if (!shouldRelink) {
        return;
    }
    await trackEvent(ctx, cloudApiService, 'willLinkProject', {});
    const projects = await getProjectsList(ctx, cloudApiService, existingConfig);
    if (!projects) {
        return;
    }
    const answer = await getUserSelection(ctx, projects);
    if (!answer) {
        return;
    }
    try {
        const { confirmAction } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmAction',
                message: 'Warning: Once linked, deploying from CLI will replace the existing project and its data. Confirm to proceed:',
                default: false
            }
        ]);
        if (!confirmAction) {
            await trackEvent(ctx, cloudApiService, 'didNotLinkProject', {
                cancelledProjectName: answer.linkProject.name,
                currentProjectName: existingConfig ? existingConfig.project?.name : null
            });
            return;
        }
        await save({
            project: answer.linkProject
        });
        logger.log(` You have successfully linked your project to ${chalk.cyan(answer.linkProject.displayName)}. You are now able to deploy your project.`);
        await trackEvent(ctx, cloudApiService, 'didLinkProject', {
            projectInternalName: answer.linkProject
        });
    } catch (e) {
        logger.debug('Failed to link project', e);
        logger.error('An error occurred while linking the project.');
        await trackEvent(ctx, cloudApiService, 'didNotLinkProject', {
            projectInternalName: answer.linkProject
        });
    }
});

export { action as default };
//# sourceMappingURL=action.mjs.map
