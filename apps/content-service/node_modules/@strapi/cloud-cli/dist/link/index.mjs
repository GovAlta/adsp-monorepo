import action from './action.mjs';
import command from './command.mjs';

var link = {
    name: 'link-project',
    description: 'Link a local directory to a Strapi Cloud project',
    action,
    command
};

export { action, command, link as default };
//# sourceMappingURL=index.mjs.map
