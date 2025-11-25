import require$$0 from 'lodash/fp';
import require$$1 from '@strapi/utils';
import { __require as requireVisitors } from './visitors/index.mjs';

var sanitizers;
var hasRequiredSanitizers;
function requireSanitizers() {
    if (hasRequiredSanitizers) return sanitizers;
    hasRequiredSanitizers = 1;
    const { curry } = require$$0;
    const { traverseEntity, async } = require$$1;
    const { removeUserRelationFromRoleEntities } = requireVisitors();
    const sanitizeUserRelationFromRoleEntities = curry((schema, entity)=>{
        return traverseEntity(removeUserRelationFromRoleEntities, {
            schema,
            getModel: strapi.getModel.bind(strapi)
        }, entity);
    });
    const defaultSanitizeOutput = curry((schema, entity)=>{
        return async.pipe(sanitizeUserRelationFromRoleEntities(schema))(entity);
    });
    sanitizers = {
        sanitizeUserRelationFromRoleEntities,
        defaultSanitizeOutput
    };
    return sanitizers;
}

export { requireSanitizers as __require };
//# sourceMappingURL=sanitizers.mjs.map
