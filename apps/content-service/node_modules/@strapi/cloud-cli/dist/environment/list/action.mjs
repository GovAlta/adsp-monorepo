import chalk from 'chalk';
import { cloudApiFactory } from '../../services/cli-api.mjs';
import 'fs-extra';
import 'path';
import 'lodash';
import { tokenServiceFactory } from '../../services/token.mjs';
import 'fast-safe-stringify';
import 'ora';
import 'cli-progress';
import { promptLogin } from '../../login/action.mjs';
import { trackEvent } from '../../utils/analytics.mjs';
import { getLocalProject } from '../../utils/get-local-config.mjs';

var action = (async (ctx)=>{
    const { getValidToken } = await tokenServiceFactory(ctx);
    const token = await getValidToken(ctx, promptLogin);
    const { logger } = ctx;
    if (!token) {
        return;
    }
    const project = await getLocalProject(ctx);
    if (!project) {
        ctx.logger.debug(`No valid local project configuration was found.`);
        return;
    }
    const cloudApiService = await cloudApiFactory(ctx, token);
    const spinner = logger.spinner('Fetching environments...').start();
    await trackEvent(ctx, cloudApiService, 'willListEnvironment', {
        projectInternalName: project.name
    });
    try {
        const { data: { data: environmentsList } } = await cloudApiService.listEnvironments({
            name: project.name
        });
        spinner.succeed();
        logger.log(environmentsList);
        await trackEvent(ctx, cloudApiService, 'didListEnvironment', {
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
        await trackEvent(ctx, cloudApiService, 'didNotListEnvironment', {
            projectInternalName: project.name
        });
    }
});

export { action as default };
//# sourceMappingURL=action.mjs.map
