import require$$0 from 'fs';
import require$$1 from 'path';
import { __require as requireUsersPermissions } from './strategies/users-permissions.mjs';
import { __require as requireSanitizers } from './utils/sanitize/sanitizers.mjs';
import { __require as requireGraphql } from './graphql/index.mjs';

var register;
var hasRequiredRegister;
function requireRegister() {
    if (hasRequiredRegister) return register;
    hasRequiredRegister = 1;
    const fs = require$$0;
    const path = require$$1;
    const authStrategy = requireUsersPermissions();
    const sanitizers = requireSanitizers();
    register = ({ strapi })=>{
        strapi.get('auth').register('content-api', authStrategy);
        strapi.sanitizers.add('content-api.output', sanitizers.defaultSanitizeOutput);
        if (strapi.plugin('graphql')) {
            requireGraphql()({
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

export { requireRegister as __require };
//# sourceMappingURL=register.mjs.map
