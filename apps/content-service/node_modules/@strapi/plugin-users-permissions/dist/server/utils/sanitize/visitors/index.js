'use strict';

var removeUserRelationFromRoleEntities = require('./remove-user-relation-from-role-entities.js');

var visitors;
var hasRequiredVisitors;
function requireVisitors() {
    if (hasRequiredVisitors) return visitors;
    hasRequiredVisitors = 1;
    visitors = {
        removeUserRelationFromRoleEntities: removeUserRelationFromRoleEntities.__require()
    };
    return visitors;
}

exports.__require = requireVisitors;
//# sourceMappingURL=index.js.map
