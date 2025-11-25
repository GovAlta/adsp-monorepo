import { createCommand } from 'commander';
import { runAction } from '../utils/helpers.mjs';
import action from './action.mjs';

/**
 * `$ deploy project to the cloud`
 */ const command = ({ ctx })=>{
    return createCommand('cloud:deploy').alias('deploy').description('Deploy a Strapi Cloud project').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").option('-f, --force', 'Skip confirmation to deploy').option('-e, --env <name>', 'Specify the environment to deploy').action((opts)=>runAction('deploy', action)(ctx, opts));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
