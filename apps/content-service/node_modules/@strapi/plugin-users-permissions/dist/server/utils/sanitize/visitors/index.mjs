import { __require as requireRemoveUserRelationFromRoleEntities } from './remove-user-relation-from-role-entities.mjs';

var visitors;
var hasRequiredVisitors;
function requireVisitors() {
    if (hasRequiredVisitors) return visitors;
    hasRequiredVisitors = 1;
    visitors = {
        removeUserRelationFromRoleEntities: requireRemoveUserRelationFromRoleEntities()
    };
    return visitors;
}

export { requireVisitors as __require };
//# sourceMappingURL=index.mjs.map
