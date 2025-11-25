import Permission from './Permission.mjs';
import User from './User.mjs';
import Role from './Role.mjs';
import apiToken from './api-token.mjs';
import apiTokenPermission from './api-token-permission.mjs';
import transferToken from './transfer-token.mjs';
import transferTokenPermission from './transfer-token-permission.mjs';
import session from './session.mjs';

var contentTypes = {
    permission: {
        schema: Permission
    },
    user: {
        schema: User
    },
    role: {
        schema: Role
    },
    'api-token': {
        schema: apiToken
    },
    'api-token-permission': {
        schema: apiTokenPermission
    },
    'transfer-token': {
        schema: transferToken
    },
    'transfer-token-permission': {
        schema: transferTokenPermission
    },
    session: {
        schema: session
    }
};

export { contentTypes as default };
//# sourceMappingURL=index.mjs.map
