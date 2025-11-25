import loginAction from './action.mjs';
import command from './command.mjs';

var login = {
    name: 'login',
    description: 'Strapi Cloud Login',
    action: loginAction,
    command
};

export { loginAction as action, command, login as default };
//# sourceMappingURL=index.mjs.map
