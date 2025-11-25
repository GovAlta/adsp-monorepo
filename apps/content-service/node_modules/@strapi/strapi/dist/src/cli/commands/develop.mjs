import { createCommand } from 'commander';
import cluster from 'node:cluster';
import { develop } from '../../node/develop.mjs';
import { handleUnexpectedError } from '../../node/core/errors.mjs';

const action = async (options)=>{
    try {
        if (cluster.isPrimary) {
            if (options.bundler === 'webpack') {
                options.logger.warn('[@strapi/strapi]: Using webpack as a bundler is deprecated. You should migrate to vite.');
            }
        }
        await develop(options);
    } catch (err) {
        handleUnexpectedError(err);
    }
};
/**
 * `$ strapi develop`
 */ const command = ({ ctx })=>{
    return createCommand('develop').alias('dev').option('--bundler [bundler]', 'Bundler to use (webpack or vite)', 'vite').option('-d, --debug', 'Enable debugging mode with verbose logs', false).option('--silent', "Don't log anything", false).option('--polling', 'Watch for file changes in network directories', false).option('--watch-admin', 'Watch the admin panel for hot changes', true).option('--no-watch-admin', 'Do not watch the admin panel for hot changes').option('--open', 'Open the admin in your browser', true).description('Start your Strapi application in development mode').action(async (options)=>{
        return action({
            ...options,
            ...ctx
        });
    });
};

export { command };
//# sourceMappingURL=develop.mjs.map
