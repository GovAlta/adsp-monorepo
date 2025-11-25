'use strict';

var require$$0 = require('fs');
var require$$1 = require('path');
var usersPermissions = require('./strategies/users-permissions.js');
var sanitizers = require('./utils/sanitize/sanitizers.js');
var index = require('./graphql/index.js');

var register;
var hasRequiredRegister;
function requireRegister() {
    if (hasRequiredRegister) return register;
    hasRequiredRegister = 1;
    const fs = require$$0;
    const path = require$$1;
    const authStrategy = usersPermissions.__require();
    const sanitizers$1 = sanitizers.__require();
    register = ({ strapi })=>{
        strapi.get('auth').register('content-api', authStrategy);
        strapi.sanitizers.add('content-api.output', sanitizers$1.defaultSanitizeOutput);
        if (strapi.plugin('graphql')) {
            index.__require()({
                strapi
            });
        }
        if (strapi.plugin('documentation')) {
            const specPath = path.join(__dirname, '../../documentation/content-api.yaml');
            const spec = fs.readFileSync(specPath, 'utf8');
            strapi.plugin('documentation').service('override').registerOverride(spec, {
                pluginOrigin: 'users-permissions',
                excludeFromGeneration: [
                    'users-permissions'
                ]
            });
        }
    };
    return register;
}

exports.__require = requireRegister;
//# sourceMappingURL=register.js.map
