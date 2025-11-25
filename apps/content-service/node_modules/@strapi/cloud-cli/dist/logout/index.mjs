import action from './action.mjs';
import command from './command.mjs';

var logout = {
    name: 'logout',
    description: 'Strapi Cloud Logout',
    action,
    command
};

export { action, command, logout as default };
//# sourceMappingURL=index.mjs.map
