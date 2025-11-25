import { runAction } from '../../utils/helpers.mjs';
import action from './action.mjs';
import { initializeEnvironmentCommand } from '../command.mjs';

const command = ({ command, ctx })=>{
    const environmentCmd = initializeEnvironmentCommand(command, ctx);
    environmentCmd.command('list').description('List Strapi Cloud project environments').option('-d, --debug', 'Enable debugging mode with verbose logs').option('-s, --silent', "Don't log anything").action(()=>runAction('list', action)(ctx));
};

export { command as default };
//# sourceMappingURL=command.mjs.map
