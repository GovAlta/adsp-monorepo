import admin from './admin.mjs';
import authentication from './authentication.mjs';
import permissions from './permissions.mjs';
import users from './users.mjs';
import roles from './roles.mjs';
import webhooks from './webhooks.mjs';
import apiTokens from './api-tokens.mjs';
import contentApi from './content-api.mjs';
import transfer from './transfer.mjs';
import homepage from './homepage.mjs';

const routes = {
    admin: {
        type: 'admin',
        routes: [
            ...admin,
            ...authentication,
            ...permissions,
            ...users,
            ...roles,
            ...webhooks,
            ...apiTokens,
            ...contentApi,
            ...transfer,
            ...homepage
        ]
    }
};

export { routes as default };
//# sourceMappingURL=index.mjs.map
