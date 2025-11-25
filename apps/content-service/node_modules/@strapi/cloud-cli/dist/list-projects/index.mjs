import action from './action.mjs';
import command from './command.mjs';

var listProjects = {
    name: 'list-projects',
    description: 'List Strapi Cloud projects',
    action,
    command
};

export { action, command, listProjects as default };
//# sourceMappingURL=index.mjs.map
