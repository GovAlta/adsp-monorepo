import action from './action.mjs';
import command from './command.mjs';

var listEnvironments = {
    name: 'list-environments',
    description: 'List Strapi Cloud environments',
    action,
    command
};

export { action, command, listEnvironments as default };
//# sourceMappingURL=index.mjs.map
