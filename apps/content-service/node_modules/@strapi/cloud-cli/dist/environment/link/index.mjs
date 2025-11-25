import action from './action.mjs';
import command from './command.mjs';

var linkEnvironment = {
    name: 'link-environment',
    description: 'Link Strapi Cloud environment to a local project',
    action,
    command
};

export { action, command, linkEnvironment as default };
//# sourceMappingURL=index.mjs.map
