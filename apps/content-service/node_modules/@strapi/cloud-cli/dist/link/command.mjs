import { runAction } from '../utils/helpers.mjs';
import action from './action.mjs';

/**
 * `$ link local directory to project of the cloud`
 */ const command = ({ command, ctx })=>{
    command.command('cloud:link').alias('link').description('Link a local directory to a Strapi Cloud project').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('link', action)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
