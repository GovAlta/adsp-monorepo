'use strict';

var permission;
var hasRequiredPermission;
function requirePermission() {
    if (hasRequiredPermission) return permission;
    hasRequiredPermission = 1;
    permission = {
        collectionName: 'up_permissions',
        info: {
            name: 'permission',
            description: '',
            singularName: 'permission',
            pluralName: 'permissions',
            displayName: 'Permission'
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
            action: {
                type: 'string',
                required: true,
                configurable: false
            },
            role: {
                type: 'relation',
                relation: 'manyToOne',
                target: 'plugin::users-permissions.role',
                inversedBy: 'permissions',
                configurable: false
            }
        }
    };
    return permission;
}

exports.__require = requirePermission;
//# sourceMappingURL=index.js.map
