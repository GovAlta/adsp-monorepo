'use strict';

var index = require('./permission/index.js');
var index$1 = require('./role/index.js');
var index$2 = require('./user/index.js');

var contentTypes;
var hasRequiredContentTypes;
function requireContentTypes() {
    if (hasRequiredContentTypes) return contentTypes;
    hasRequiredContentTypes = 1;
    const permission = index.__require();
    const role = index$1.__require();
    const user = index$2.__require();
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

exports.__require = requireContentTypes;
//# sourceMappingURL=index.js.map
