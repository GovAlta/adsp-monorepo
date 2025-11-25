import chalk from 'chalk';
import 'axios';
import 'fs-extra';
import 'os';
import '../config/api.mjs';
import 'path';
import 'xdg-app-paths';
import { retrieve } from '../services/strapi-info-save.mjs';
import 'jwks-rsa';
import 'jsonwebtoken';
import 'fast-safe-stringify';
import 'ora';
import 'cli-progress';

async function getLocalConfig(ctx) {
    try {
        return await retrieve();
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

export { getLocalConfig, getLocalProject };
//# sourceMappingURL=get-local-config.mjs.map
