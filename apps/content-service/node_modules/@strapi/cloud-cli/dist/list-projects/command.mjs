import { runAction } from '../utils/helpers.mjs';
import action from './action.mjs';

/**
 * `$ list project from the cloud`
 */ const command = ({ command, ctx })=>{
    command.command('cloud:projects').alias('projects').description('List Strapi Cloud projects').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('projects', action)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
