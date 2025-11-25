import { createCommand } from 'commander';
import { runAction } from '../utils/helpers.mjs';
import loginAction from './action.mjs';

/**
 * `$ cloud device flow login`
 */ const command = ({ ctx })=>{
    return createCommand('cloud:login').alias('login').description('Strapi Cloud Login').addHelpText('after', '\nAfter running this command, you will be prompted to enter your authentication information.').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('login', loginAction)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
