import action from './action.mjs';
import command from './command.mjs';

var createProject = {
    name: 'create-project',
    description: 'Create a new project',
    action,
    command
};

export { action, command, createProject as default };
//# sourceMappingURL=index.mjs.map
