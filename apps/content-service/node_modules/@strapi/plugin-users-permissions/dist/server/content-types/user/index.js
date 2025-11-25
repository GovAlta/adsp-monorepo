'use strict';

var schemaConfig = require('./schema-config.js');

var user;
var hasRequiredUser;
function requireUser() {
    if (hasRequiredUser) return user;
    hasRequiredUser = 1;
    const schemaConfig$1 = schemaConfig.__require();
    user = {
        collectionName: 'up_users',
        info: {
            name: 'user',
            description: '',
            singularName: 'user',
            pluralName: 'users',
            displayName: 'User'
        },
        options: {
            timestamps: true
        },
        attributes: {
            username: {
                type: 'string',
                minLength: 3,
                unique: true,
                configurable: false,
                required: true
            },
            email: {
                type: 'email',
                minLength: 6,
                configurable: false,
                required: true
            },
            provider: {
                type: 'string',
                configurable: false
            },
            password: {
                type: 'password',
                minLength: 6,
                configurable: false,
                private: true,
                searchable: false
            },
            resetPasswordToken: {
                type: 'string',
                configurable: false,
                private: true,
                searchable: false
            },
            confirmationToken: {
                type: 'string',
                configurable: false,
                private: true,
                searchable: false
            },
            confirmed: {
                type: 'boolean',
                default: false,
                configurable: false
            },
            blocked: {
                type: 'boolean',
                default: false,
                configurable: false
            },
            role: {
                type: 'relation',
                relation: 'manyToOne',
                target: 'plugin::users-permissions.role',
                inversedBy: 'users',
                configurable: false
            }
        },
        config: schemaConfig$1
    };
    return user;
}

exports.__require = requireUser;
//# sourceMappingURL=index.js.map
