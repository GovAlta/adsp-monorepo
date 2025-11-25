'use strict';

var role;
var hasRequiredRole;
function requireRole() {
    if (hasRequiredRole) return role;
    hasRequiredRole = 1;
    role = {
        collectionName: 'up_roles',
        info: {
            name: 'role',
            description: '',
            singularName: 'role',
            pluralName: 'roles',
            displayName: 'Role'
        },
        pluginOptions: {
            'content-manager': {
                visible: false
            },
            'content-type-builder': {
                visible: false
            }
        },
        attributes: {
            name: {
                type: 'string',
                minLength: 3,
                required: true,
                configurable: false
            },
            description: {
                type: 'string',
                configurable: false
            },
            type: {
                type: 'string',
                unique: true,
                configurable: false
            },
            permissions: {
                type: 'relation',
                relation: 'oneToMany',
                target: 'plugin::users-permissions.permission',
                mappedBy: 'role',
                configurable: false
            },
            users: {
                type: 'relation',
                relation: 'oneToMany',
                target: 'plugin::users-permissions.user',
                mappedBy: 'role',
                configurable: false
            }
        }
    };
    return role;
}

exports.__require = requireRole;
//# sourceMappingURL=index.js.map
