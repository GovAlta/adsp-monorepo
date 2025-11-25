import { __require as requirePermission } from './permission/index.mjs';
import { __require as requireRole } from './role/index.mjs';
import { __require as requireUser } from './user/index.mjs';

var contentTypes;
var hasRequiredContentTypes;
function requireContentTypes() {
    if (hasRequiredContentTypes) return contentTypes;
    hasRequiredContentTypes = 1;
    const permission = requirePermission();
    const role = requireRole();
    const user = requireUser();
    contentTypes = {
        permission: {
            schema: permission
        },
        role: {
            schema: role
        },
        user: {
            schema: user
        }
    };
    return contentTypes;
}

export { requireContentTypes as __require };
//# sourceMappingURL=index.mjs.map
