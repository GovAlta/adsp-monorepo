import { cloudApiFactory } from '../services/cli-api.mjs';
import 'fs-extra';
import 'path';
import 'lodash';
import { tokenServiceFactory } from '../services/token.mjs';
import 'chalk';
import 'fast-safe-stringify';
import 'ora';
import 'cli-progress';
import { promptLogin } from '../login/action.mjs';

var action = (async (ctx)=>{
    const { getValidToken } = await tokenServiceFactory(ctx);
    const token = await getValidToken(ctx, promptLogin);
    const { logger } = ctx;
    if (!token) {
        return;
    }
    const cloudApiService = await cloudApiFactory(ctx, token);
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

export { action as default };
//# sourceMappingURL=action.mjs.map
