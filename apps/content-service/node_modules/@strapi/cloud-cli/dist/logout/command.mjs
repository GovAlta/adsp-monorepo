import { createCommand } from 'commander';
import { runAction } from '../utils/helpers.mjs';
import action from './action.mjs';

/**
 * `$ cloud device flow logout`
 */ const command = ({ ctx })=>{
    return createCommand('cloud:logout').alias('logout').description('Strapi Cloud Logout').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('logout', action)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
