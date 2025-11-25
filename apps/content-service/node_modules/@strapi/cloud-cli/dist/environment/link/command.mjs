import { runAction } from '../../utils/helpers.mjs';
import action from './action.mjs';
import { initializeEnvironmentCommand } from '../command.mjs';

const command = ({ command, ctx })=>{
    const environmentCmd = initializeEnvironmentCommand(command, ctx);
    environmentCmd.command('link').description('Link project to a specific Strapi Cloud project environment').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('link', action)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
