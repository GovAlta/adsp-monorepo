import { createCommand } from 'commander';
import { runAction } from '../utils/helpers.mjs';
import action from './action.mjs';

/**
 * `$ create project in Strapi cloud`
 */ const command = ({ ctx })=>{
    return createCommand('cloud:create-project').description('Create a Strapi Cloud project').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('cloud:create-project', action)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
