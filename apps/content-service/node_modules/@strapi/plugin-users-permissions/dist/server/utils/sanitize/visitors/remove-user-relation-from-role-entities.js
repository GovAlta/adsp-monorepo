'use strict';

var removeUserRelationFromRoleEntities;
var hasRequiredRemoveUserRelationFromRoleEntities;
function requireRemoveUserRelationFromRoleEntities() {
    if (hasRequiredRemoveUserRelationFromRoleEntities) return removeUserRelationFromRoleEntities;
    hasRequiredRemoveUserRelationFromRoleEntities = 1;
    removeUserRelationFromRoleEntities = ({ schema, key, attribute }, { remove })=>{
        if (attribute?.type === 'relation' && attribute?.target === 'plugin::users-permissions.user' && schema.uid === 'plugin::users-permissions.role') {
            remove(key);
        }
    };
    return removeUserRelationFromRoleEntities;
}

exports.__require = requireRemoveUserRelationFromRoleEntities;
//# sourceMappingURL=remove-user-relation-from-role-entities.js.map
