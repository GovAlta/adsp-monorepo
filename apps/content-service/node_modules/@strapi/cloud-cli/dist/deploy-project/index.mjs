import action from './action.mjs';
import command from './command.mjs';

var deployProject = {
    name: 'deploy-project',
    description: 'Deploy a Strapi Cloud project',
    action,
    command
};

export { action, command, deployProject as default };
//# sourceMappingURL=index.mjs.map
