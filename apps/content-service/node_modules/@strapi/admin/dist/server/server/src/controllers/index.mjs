import admin from './admin.mjs';
import apiToken from './api-token.mjs';
import authenticatedUser from './authenticated-user.mjs';
import authentication from './authentication.mjs';
import permission from './permission.mjs';
import role from './role.mjs';
import transfer from './transfer/index.mjs';
import user from './user.mjs';
import webhooks from './webhooks.mjs';
import contentApi from './content-api.mjs';
import homepage from './homepage.mjs';

var controllers = {
    admin,
    'api-token': apiToken,
    'authenticated-user': authenticatedUser,
    authentication,
    permission,
    role,
    transfer,
    user,
    webhooks,
    'content-api': contentApi,
    homepage
};

export { controllers as default };
//# sourceMappingURL=index.mjs.map
